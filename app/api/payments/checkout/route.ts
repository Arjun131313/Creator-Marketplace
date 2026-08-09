import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { stripe, platformFeeForAmount } from "@/lib/stripe"

// Creates a Stripe Checkout Session that authorizes (but does not capture) payment
// for an accepted application. Funds sit held on the brand's card — this is the
// "escrow" step — until a future capture (release) or cancel (refund) call.
//
// NOTE: there's currently no submission/approval UI in the app to trigger the
// capture step from. This route + the webhook below establish the payment
// plumbing; wiring "approve content -> capture payment" into a real page is a
// separate, larger piece of work.
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

  const { data: application, error: applicationError } = await adminClient
    .from("applications")
    .select("id,job_id,creator_id,status,proposed_rate")
    .eq("id", applicationId)
    .single()

  if (applicationError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  if (application.status !== "accepted") {
    return NextResponse.json(
      { error: "Only accepted applications can be paid" },
      { status: 400 },
    )
  }

  const { data: job, error: jobError } = await adminClient
    .from("jobs")
    .select("id,title,budget,brand_id")
    .eq("id", application.job_id)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  if (job.brand_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Avoid double-charging: reuse an existing non-refunded payment if one exists.
  const { data: existingPayment } = await adminClient
    .from("payments")
    .select("id,status")
    .eq("application_id", applicationId)
    .maybeSingle()

  if (existingPayment && existingPayment.status !== "refunded") {
    return NextResponse.json(
      { error: `A payment already exists for this application (status: ${existingPayment.status})` },
      { status: 409 },
    )
  }

  const amount = application.proposed_rate ?? job.budget
  const amountMinorUnits = Math.round(amount * 100)
  const platformFee = platformFeeForAmount(amountMinorUnits) / 100

  const { data: payment, error: insertError } = await adminClient
    .from("payments")
    .insert({
      job_id: job.id,
      application_id: application.id,
      brand_id: job.brand_id,
      creator_id: application.creator_id,
      amount,
      currency: "gbp",
      status: "pending",
      platform_fee: platformFee,
    })
    .select("id")
    .single()

  if (insertError || !payment) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create payment record" },
      { status: 500 },
    )
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          payment_id: payment.id,
          job_id: job.id,
          application_id: application.id,
          brand_id: job.brand_id,
          creator_id: application.creator_id,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: `RealReach Agency job: ${job.title}` },
            unit_amount: amountMinorUnits,
          },
          quantity: 1,
        },
      ],
      metadata: { payment_id: payment.id },
      success_url: `${origin}/brand/jobs/${job.id}/applications?payment=success`,
      cancel_url: `${origin}/brand/jobs/${job.id}/applications?payment=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    // Clean up the payment row we created if Stripe checkout creation itself fails,
    // so a retry doesn't trip the "already exists" check above.
    await adminClient.from("payments").delete().eq("id", payment.id)
    const message = err instanceof Error ? err.message : "Failed to create checkout session"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
