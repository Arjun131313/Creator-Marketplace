import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { sendEmail } from "@/lib/email"
import {
  notifyApplicationDecision,
  notifyContentReviewed,
  notifyContentSubmitted,
  notifyEventApplication,
  notifyEventDecision,
} from "@/lib/notifications"

// Notifications for actions the browser performs directly against Supabase
// (accepting an application, submitting content, reviewing it). Anything that
// happens server-side — payments, payouts, disputes, subscriptions — notifies
// from the webhook or route that owns it instead, so it still fires when nobody
// has the site open.
//
// Every branch re-checks that the caller is actually a party to the thing they're
// notifying about; the auth token proves who they are, not what they're allowed
// to trigger an email about.
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

  const payload = body as Record<string, unknown>
  const { type } = payload as { type?: string }
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // ── New message ──────────────────────────────────────────────────────────
  if (type === "message") {
    const conversationId = payload.conversationId
    if (typeof conversationId !== "string") {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    const { data: conversation } = await adminClient
      .from("conversations")
      .select("participant_a,participant_b")
      .eq("id", conversationId)
      .single()

    if (!conversation || (conversation.participant_a !== user.id && conversation.participant_b !== user.id)) {
      return NextResponse.json({ error: "Not a participant in this conversation" }, { status: 403 })
    }

    const recipientId =
      conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a

    const [senderProfile, recipientUser] = await Promise.all([
      adminClient.from("profiles").select("display_name").eq("id", user.id).single(),
      adminClient.auth.admin.getUserById(recipientId),
    ])

    const recipientEmail = recipientUser.data.user?.email
    if (!recipientEmail) return NextResponse.json({ success: true })

    const senderName = senderProfile.data?.display_name ?? "Someone"

    await sendEmail({
      to: recipientEmail,
      subject: `New message from ${senderName} on RealReach Agency`,
      html: `<p>${senderName} sent you a new message on RealReach Agency.</p><p><a href="${origin}/messages/${conversationId}">View the conversation</a></p>`,
    })

    return NextResponse.json({ success: true })
  }

  // ── Creator applied to a job ─────────────────────────────────────────────
  if (type === "application") {
    const jobId = payload.jobId
    if (typeof jobId !== "string") {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 })
    }

    const [{ data: job }, { data: application }, { data: creatorProfile }] = await Promise.all([
      adminClient.from("jobs").select("brand_id,title").eq("id", jobId).single(),
      adminClient
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("creator_id", user.id)
        .maybeSingle(),
      adminClient.from("profiles").select("display_name").eq("id", user.id).single(),
    ])

    if (!job || !application) {
      return NextResponse.json({ error: "No matching application found" }, { status: 403 })
    }

    const { data: brandUser } = await adminClient.auth.admin.getUserById(job.brand_id)
    const brandEmail = brandUser.user?.email
    if (!brandEmail) return NextResponse.json({ success: true })

    const creatorName = creatorProfile?.display_name ?? "A creator"

    await sendEmail({
      to: brandEmail,
      subject: `${creatorName} applied to "${job.title}" on RealReach Agency`,
      html: `<p>${creatorName} just applied to your job <strong>${job.title}</strong> on RealReach Agency.</p><p><a href="${origin}/brand/jobs/${jobId}/applications">Review the application</a></p>`,
    })

    return NextResponse.json({ success: true })
  }

  // ── Brand accepted or rejected an application ────────────────────────────
  if (type === "application_decision") {
    const applicationId = payload.applicationId
    if (typeof applicationId !== "string") {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 })
    }

    const { data: application } = await adminClient
      .from("applications")
      .select("id,job_id,creator_id,status")
      .eq("id", applicationId)
      .single()

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const { data: job } = await adminClient
      .from("jobs")
      .select("brand_id,title")
      .eq("id", application.job_id)
      .single()

    if (!job || job.brand_id !== user.id) {
      return NextResponse.json({ error: "Only the hiring brand can send this" }, { status: 403 })
    }

    await notifyApplicationDecision(adminClient, {
      creatorId: application.creator_id,
      jobId: application.job_id,
      jobTitle: job.title,
      accepted: application.status === "accepted",
    })

    return NextResponse.json({ success: true })
  }

  // ── Creator submitted content for review ─────────────────────────────────
  if (type === "content_submitted") {
    const submissionId = payload.submissionId
    if (typeof submissionId !== "string") {
      return NextResponse.json({ error: "submissionId is required" }, { status: 400 })
    }

    const { data: submission } = await adminClient
      .from("submissions")
      .select("id,application_id")
      .eq("id", submissionId)
      .single()

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const { data: application } = await adminClient
      .from("applications")
      .select("job_id,creator_id")
      .eq("id", submission.application_id)
      .single()

    if (!application || application.creator_id !== user.id) {
      return NextResponse.json({ error: "Only the creator on this job can send this" }, { status: 403 })
    }

    const { data: job } = await adminClient
      .from("jobs")
      .select("brand_id,title")
      .eq("id", application.job_id)
      .single()

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    await notifyContentSubmitted(adminClient, {
      brandId: job.brand_id,
      creatorId: user.id,
      jobId: application.job_id,
      jobTitle: job.title,
    })

    return NextResponse.json({ success: true })
  }

  // ── Brand reviewed the content ───────────────────────────────────────────
  if (type === "content_reviewed") {
    const submissionId = payload.submissionId
    if (typeof submissionId !== "string") {
      return NextResponse.json({ error: "submissionId is required" }, { status: 400 })
    }

    const { data: submission } = await adminClient
      .from("submissions")
      .select("id,application_id,status,reviewer_notes")
      .eq("id", submissionId)
      .single()

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const { data: application } = await adminClient
      .from("applications")
      .select("job_id,creator_id")
      .eq("id", submission.application_id)
      .single()

    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 })

    const { data: job } = await adminClient
      .from("jobs")
      .select("brand_id,title")
      .eq("id", application.job_id)
      .single()

    if (!job || job.brand_id !== user.id) {
      return NextResponse.json({ error: "Only the hiring brand can send this" }, { status: 403 })
    }

    const status = submission.status
    if (status !== "approved" && status !== "rejected" && status !== "revision_requested") {
      return NextResponse.json({ success: true })
    }

    await notifyContentReviewed(adminClient, {
      creatorId: application.creator_id,
      jobId: application.job_id,
      jobTitle: job.title,
      status,
      notes: submission.reviewer_notes ?? null,
    })

    return NextResponse.json({ success: true })
  }

  // ── Creator applied to attend an event ───────────────────────────────────
  if (type === "event_application") {
    const eventId = payload.eventId
    if (typeof eventId !== "string") {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    const [{ data: event }, { data: application }] = await Promise.all([
      adminClient.from("events").select("brand_id,title").eq("id", eventId).single(),
      adminClient
        .from("event_applications")
        .select("id")
        .eq("event_id", eventId)
        .eq("creator_id", user.id)
        .maybeSingle(),
    ])

    if (!event || !application) {
      return NextResponse.json({ error: "No matching event application found" }, { status: 403 })
    }

    await notifyEventApplication(adminClient, {
      brandId: event.brand_id,
      creatorId: user.id,
      eventId,
      eventTitle: event.title,
    })

    return NextResponse.json({ success: true })
  }

  // ── Brand accepted or declined an event applicant ────────────────────────
  if (type === "event_decision") {
    const applicationId = payload.applicationId
    if (typeof applicationId !== "string") {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 })
    }

    const { data: application } = await adminClient
      .from("event_applications")
      .select("id,event_id,creator_id,status")
      .eq("id", applicationId)
      .single()

    if (!application) {
      return NextResponse.json({ error: "Event application not found" }, { status: 404 })
    }

    const { data: event } = await adminClient
      .from("events")
      .select("brand_id,title,city")
      .eq("id", application.event_id)
      .single()

    if (!event || event.brand_id !== user.id) {
      return NextResponse.json({ error: "Only the hosting brand can send this" }, { status: 403 })
    }

    await notifyEventDecision(adminClient, {
      creatorId: application.creator_id,
      eventId: application.event_id,
      eventTitle: event.title,
      city: event.city,
      accepted: application.status === "accepted",
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown notification type" }, { status: 400 })
}
