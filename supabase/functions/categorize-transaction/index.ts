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

    const { transaction_id } = await req.json()
    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "transaction_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Fetch the transaction
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("id, wallet_id, amount, type, description, category")
      .eq("id", transaction_id)
      .single()

    if (txError || !tx) throw new Error("Transaction not found")

    // Skip categorization for transfers/top-ups that already have a category
    if (tx.category && tx.category !== "null") {
      return new Response(JSON.stringify({ skipped: true, reason: "already categorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Pull recent transaction history on this wallet for context (helps flag anomalies)
    const { data: recentTx } = await supabase
      .from("transactions")
      .select("amount, type, category, created_at")
      .eq("wallet_id", tx.wallet_id)
      .order("created_at", { ascending: false })
      .limit(15)

    const avgAmount =
      recentTx && recentTx.length > 0
        ? recentTx.reduce((sum, t) => sum + Number(t.amount), 0) / recentTx.length
        : 0

    const prompt = `You are a transaction categorizer for a student campus wallet app. Analyze this transaction and respond with ONLY valid JSON, no other text.

Transaction: "${tx.description || "No description"}", amount: ${tx.amount}, type: ${tx.type}
Recent average transaction amount on this wallet: ${avgAmount.toFixed(2)}
Recent transaction count: ${recentTx?.length ?? 0}

Categorize into ONE of: food, transport, shopping, entertainment, bills, transfer, education, health, other

Flag as suspicious (ai_flagged: true) ONLY if the amount is unusually large compared to the average (e.g. more than 5x), or the description suggests something atypical for a student wallet.

Respond with exactly this JSON shape:
{"category": "string", "ai_flagged": boolean, "ai_flag_reason": "string or null", "confidence": number between 0 and 1}`

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
    const rawText = aiData.choices?.[0]?.message?.content ?? "{}"
    const cleaned = rawText.replace(/```json|```/g, "").trim()
    const result = JSON.parse(cleaned)

    // Update the transaction with AI results
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        category: result.category ?? "other",
        ai_flagged: result.ai_flagged ?? false,
        ai_flag_reason: result.ai_flag_reason ?? null,
        ai_category_confidence: result.confidence ?? null,
      })
      .eq("id", transaction_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})