import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // ---- manual auth verification ----
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    // ---- end auth block ----

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", user.id)
      .single()

    if (!wallet) throw new Error("Wallet not found")

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: debits } = await supabase
      .from("transactions")
      .select("amount, category, created_at")
      .eq("wallet_id", wallet.id)
      .eq("type", "debit")
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: false })

    // Not enough history to make a meaningful call — skip silently
    if (!debits || debits.length < 3) {
      return new Response(JSON.stringify({ warning: false, reason: "insufficient history" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const totalSpent = debits.reduce((sum, t) => sum + Number(t.amount), 0)
    const daysOfHistory = Math.max(
      1,
      Math.ceil((Date.now() - new Date(debits[debits.length - 1].created_at).getTime()) / (24 * 60 * 60 * 1000)),
    )
    const avgDailySpend = totalSpent / daysOfHistory
    const daysUntilEmpty = avgDailySpend > 0 ? wallet.balance / avgDailySpend : Infinity

    // Only warn if genuinely at risk — under 5 days of runway at current spend rate
    const AT_RISK_THRESHOLD_DAYS = 5
    if (daysUntilEmpty >= AT_RISK_THRESHOLD_DAYS) {
      return new Response(JSON.stringify({ warning: false, days_until_empty: daysUntilEmpty }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const categoryTotals = new Map<string, number>()
    for (const t of debits) {
      const cat = t.category ?? "other"
      categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + Number(t.amount))
    }
    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "spending"

    const prompt = `You are a friendly financial assistant for a university student's campus wallet. Write ONE short, direct warning sentence (max 25 words, no preamble, no markdown) telling them their balance is running low based on recent spending. 

Current balance: ₦${wallet.balance}
Average daily spend (last ${daysOfHistory} days): ₦${avgDailySpend.toFixed(0)}
Estimated days until balance runs out: ${daysUntilEmpty.toFixed(1)}
Top spending category: ${topCategory}

Respond with ONLY the warning sentence.`

    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")!}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 80,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const aiData = await aiResponse.json()
    const warningText = aiData.choices?.[0]?.message?.content?.trim() ?? "Your balance is running low based on recent spending."

    await supabase.from("ai_insights").insert({
      user_id: user.id,
      insight_type: "budget_tip",
      content: warningText,
      metadata: { days_until_empty: daysUntilEmpty, avg_daily_spend: avgDailySpend },
    })

    return new Response(
      JSON.stringify({ warning: true, message: warningText, days_until_empty: daysUntilEmpty }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})