import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"

// Cancels a held (not-yet-captured) PaymentIntent, releasing the brand's card
// authorization without charging them. Use this for rejected work or a dispute
// resolved in the brand's favor. DB status update to "refunded" happens via the
// payment_intent.canceled webhook.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const adminClient = createAdminClient()

  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const applicationId = (body as Record<string, unknown>)?.applicationId
  if (!applicationId || typeof applicationId !== "string") {
    return NextResponse.json({ error: "Missing applicationId" }, { status: 400 })
  }

  const { data: payment, error: paymentError } = await adminClient
    .from("payments")
    .select("id,brand_id,creator_id,status,stripe_payment_intent_id")
    .eq("application_id", applicationId)
    .single()

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  }

  // Either side of the job should be able to trigger a cancel in a dispute —
  // adjust this if you want cancellation gated to a formal dispute resolution step.
  if (payment.brand_id !== user.id && payment.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (payment.status !== "held") {
    return NextResponse.json(
      { error: `Payment cannot be cancelled from status "${payment.status}"` },
      { status: 400 },
    )
  }

  if (!payment.stripe_payment_intent_id) {
    return NextResponse.json({ error: "Payment has no associated Stripe PaymentIntent yet" }, { status: 400 })
  }

  try {
    await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel payment"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
