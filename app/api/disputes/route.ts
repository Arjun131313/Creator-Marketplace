import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

// Raises a dispute on a job (and, if a payment already exists, freezes it by
// flipping payments.status to "disputed" — this blocks the brand/creator capture
// and cancel routes, which both require status="held", until a human resolves it
// via the disputes table directly (no admin UI exists yet; update `status` and
// `resolution` on the row in Supabase Studio, then flip the payment status back
// to "held" or "refunded" as appropriate).
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

  const { jobId, paymentId, reason } = body as Record<string, unknown>

  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 })
  }
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 })
  }
  if (paymentId !== undefined && typeof paymentId !== "string") {
    return NextResponse.json({ error: "Invalid paymentId" }, { status: 400 })
  }

  const { data: job, error: jobError } = await adminClient
    .from("jobs")
    .select("id,brand_id")
    .eq("id", jobId)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  let payment: { id: string; job_id: string; status: string; creator_id: string } | null = null

  if (paymentId) {
    const { data: paymentRow, error: paymentError } = await adminClient
      .from("payments")
      .select("id,job_id,status,creator_id")
      .eq("id", paymentId)
      .single()

    if (paymentError || !paymentRow || paymentRow.job_id !== jobId) {
      return NextResponse.json({ error: "Payment not found for this job" }, { status: 404 })
    }
    payment = paymentRow
  }

  const isBrand = job.brand_id === user.id
  const isPaymentCreator = payment?.creator_id === user.id

  let isJobCreator = isPaymentCreator
  if (!isBrand && !isJobCreator) {
    const { data: application } = await adminClient
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("creator_id", user.id)
      .maybeSingle()
    isJobCreator = Boolean(application)
  }

  if (!isBrand && !isJobCreator) {
    return NextResponse.json({ error: "You are not a party to this job" }, { status: 403 })
  }

  const { data: dispute, error: disputeError } = await adminClient
    .from("disputes")
    .insert({
      job_id: jobId,
      payment_id: paymentId ?? null,
      raised_by: user.id,
      reason: reason.trim(),
    })
    .select("id,job_id,payment_id,raised_by,reason,status,resolution,created_at,resolved_at")
    .single()

  if (disputeError || !dispute) {
    return NextResponse.json({ error: disputeError?.message ?? "Failed to raise dispute" }, { status: 500 })
  }

  if (payment && payment.status === "held") {
    await adminClient.from("payments").update({ status: "disputed" }).eq("id", payment.id)
  }

  return NextResponse.json({ dispute })
}
