import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"

// Terms/Help both promise escrowed funds release "automatically after the
// review window closes if no revision or dispute is raised" — this is that
// automation. Run daily via Vercel Cron (see vercel.json). Only acts on
// submissions still "pending" (the brand never reviewed) with a payment still
// "held" (untouched, undisputed) past the window — anything reviewed,
// captured, or disputed by then is left alone.
const REVIEW_WINDOW_DAYS = 7

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const cutoff = new Date(Date.now() - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleSubmissions, error: submissionsError } = await adminClient
    .from("submissions")
    .select("id,application_id,updated_at")
    .eq("status", "pending")
    .lt("updated_at", cutoff)

  if (submissionsError) {
    return NextResponse.json({ error: submissionsError.message }, { status: 500 })
  }

  const results: { submissionId: string; outcome: string }[] = []

  for (const submission of staleSubmissions ?? []) {
    const { data: payment } = await adminClient
      .from("payments")
      .select("id,stripe_payment_intent_id,status")
      .eq("application_id", submission.application_id)
      .eq("status", "held")
      .maybeSingle()

    if (!payment?.stripe_payment_intent_id) {
      results.push({ submissionId: submission.id, outcome: "skipped: no held payment" })
      continue
    }

    try {
      await stripe.paymentIntents.capture(payment.stripe_payment_intent_id)
    } catch (err) {
      const message = err instanceof Error ? err.message : "capture failed"
      results.push({ submissionId: submission.id, outcome: `error: ${message}` })
      continue
    }

    await adminClient
      .from("submissions")
      .update({
        status: "approved",
        reviewer_notes: `Automatically approved — the ${REVIEW_WINDOW_DAYS}-day review window closed with no response.`,
      })
      .eq("id", submission.id)

    results.push({ submissionId: submission.id, outcome: "released" })
  }

  return NextResponse.json({ processed: results.length, results })
}
