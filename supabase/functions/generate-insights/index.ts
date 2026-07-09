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
    // ---- NEW: manual auth verification goes here, right after the try{ ----
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

    const user_id = user.id
    // ---- end new block ----

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", user_id)
      .single()

    if (!wallet) throw new Error("Wallet not found")

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, type, category, description, created_at")
      .eq("wallet_id", wallet.id)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no recent transactions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const summary = transactions
      .map((t) => `${t.type} ₦${t.amount} (${t.category ?? "uncategorized"}) - ${t.description ?? ""}`)
      .join("\n")

    const prompt = `You are a friendly financial assistant for a university student's campus wallet. Based on this week's transaction history, write a short, encouraging, plain-language spend summary (2-3 sentences max). Mention their top spending category and one practical observation. Current balance: ₦${wallet.balance}.

Transactions this week:
${summary}

Respond with ONLY the summary text, no preamble, no markdown, no quotes.`

    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")!}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const aiData = await aiResponse.json()
    const insightText = aiData.choices?.[0]?.message?.content?.trim() ?? "No insight available."

    const { data: insight, error: insertError } = await supabase
      .from("ai_insights")
      .insert({
        user_id,
        insight_type: "spend_summary",
        content: insightText,
        metadata: { transaction_count: transactions.length },
      })
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(JSON.stringify({ success: true, insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})