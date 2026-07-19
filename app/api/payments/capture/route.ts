import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"

// Releases held (escrowed) funds to the platform balance by capturing the
// authorized PaymentIntent. Actual DB status update to "released" and payout to
// the creator's connected Stripe account happen via the payment_intent.succeeded
// webhook, not here — this route only tells Stripe to capture.
//
// Not yet wired to any UI: there's no content-submission/approval page in the app
// yet for a brand to trigger this from. Call it with { applicationId } once that
// exists.
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
    .select("id,brand_id,status,stripe_payment_intent_id")
    .eq("application_id", applicationId)
    .single()

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  }

  if (payment.brand_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (payment.status !== "held") {
    return NextResponse.json(
      { error: `Payment cannot be captured from status "${payment.status}"` },
      { status: 400 },
    )
  }

  if (!payment.stripe_payment_intent_id) {
    return NextResponse.json({ error: "Payment has no associated Stripe PaymentIntent yet" }, { status: 400 })
  }

  try {
    await stripe.paymentIntents.capture(payment.stripe_payment_intent_id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to capture payment"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
