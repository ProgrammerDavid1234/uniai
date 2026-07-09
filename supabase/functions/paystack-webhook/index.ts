import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const body = await req.text()

    // Verify the webhook actually came from Paystack (HMAC signature check)
    const signature = req.headers.get("x-paystack-signature")
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY")!

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"],
    )
    const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
    const expectedSignature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    if (signature !== expectedSignature) {
      return new Response("Invalid signature", { status: 401 })
    }

    const event = JSON.parse(body)

    if (event.event !== "charge.success") {
      return new Response("ok", { status: 200 })
    }

    const { reference, amount, metadata } = event.data
    const walletId = metadata?.wallet_id
    if (!walletId) throw new Error("Missing wallet_id in metadata")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // amount from Paystack is in kobo, convert to naira
    const nairaAmount = amount / 100

    // Credit the wallet — process_transaction handles the balance update
    const { data: tx, error: txError } = await supabase.rpc("process_transaction", {
      p_wallet_id: walletId,
      p_type: "credit",
      p_amount: nairaAmount,
      p_category: "top-up",
      p_description: "Wallet top-up via Paystack",
    })

    if (txError) throw txError

    // Attach the payment reference for idempotency — if this reference was
    // already used, this update just won't find a fresh row twice since we
    // check first
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle()

    if (existing) {
      return new Response("Already processed", { status: 200 })
    }

    // Find the transaction we just created (most recent credit on this wallet)
    // and stamp it with the reference so it can never be reprocessed
    const { data: recentTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("wallet_id", walletId)
      .eq("category", "top-up")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (recentTx) {
      await supabase
        .from("transactions")
        .update({ payment_reference: reference })
        .eq("id", recentTx.id)
    }

    return new Response("ok", { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})