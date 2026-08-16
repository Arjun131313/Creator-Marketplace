import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"
import { notifyDisputeResolved } from "@/lib/notifications"

// Resolves a dispute and unfreezes the money behind it.
//
// Admin membership is checked here against admin_users, server-side, on every
// call. The /admin pages hide themselves from non-admins, but that's cosmetic —
// this is the control that actually matters, since anyone can POST to a route.
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

  const { data: membership } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { disputeId, outcome, resolution } = body as {
    disputeId?: string
    outcome?: string
    resolution?: string
  }

  if (typeof disputeId !== "string") {
    return NextResponse.json({ error: "disputeId is required" }, { status: 400 })
  }
  if (outcome !== "release" && outcome !== "refund") {
    return NextResponse.json({ error: "outcome must be 'release' or 'refund'" }, { status: 400 })
  }
  if (typeof resolution !== "string" || resolution.trim().length < 10) {
    return NextResponse.json(
      { error: "Write a resolution of at least 10 characters — both parties see it." },
      { status: 400 },
    )
  }

  const { data: dispute } = await adminClient
    .from("disputes")
    .select("id,job_id,payment_id,status")
    .eq("id", disputeId)
    .single()

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
  }
  if (dispute.status === "resolved" || dispute.status === "closed") {
    return NextResponse.json({ error: "This dispute is already resolved" }, { status: 409 })
  }

  const { data: job } = await adminClient
    .from("jobs")
    .select("title,brand_id")
    .eq("id", dispute.job_id)
    .single()

  let payment: {
    id: string
    stripe_payment_intent_id: string | null
    status: string
    creator_id: string
    brand_id: string
  } | null = null

  if (dispute.payment_id) {
    const { data } = await adminClient
      .from("payments")
      .select("id,stripe_payment_intent_id,status,creator_id,brand_id")
      .eq("id", dispute.payment_id)
      .single()
    payment = data
  }

  // Move the money first. If Stripe rejects, the dispute stays open rather than
  // being marked resolved against a payment that never actually moved.
  if (payment?.stripe_payment_intent_id) {
    try {
      if (outcome === "release") {
        await stripe.paymentIntents.capture(payment.stripe_payment_intent_id)
      } else {
        await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe rejected the request"
      return NextResponse.json(
        { error: `Couldn't ${outcome} the payment: ${message}` },
        { status: 502 },
      )
    }
  } else if (payment) {
    // A payment row with no intent never got as far as Stripe, so there's
    // nothing to move — just unfreeze the row.
    await adminClient
      .from("payments")
      .update({ status: outcome === "release" ? "released" : "refunded" })
      .eq("id", payment.id)
  }

  const { data: resolved, error: updateError } = await adminClient
    .from("disputes")
    .update({
      status: "resolved",
      resolution: resolution.trim(),
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", disputeId)
    .select("id,status,resolution,resolved_at")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Both sides hear the outcome, whichever way it went.
  if (payment) {
    await Promise.all([
      notifyDisputeResolved(adminClient, {
        recipientId: payment.creator_id,
        jobTitle: job?.title ?? "a job",
        outcome,
        resolution: resolution.trim(),
        isCreator: true,
      }),
      notifyDisputeResolved(adminClient, {
        recipientId: payment.brand_id,
        jobTitle: job?.title ?? "a job",
        outcome,
        resolution: resolution.trim(),
        isCreator: false,
      }),
    ])
  }

  return NextResponse.json({ dispute: resolved })
}
