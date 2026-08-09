import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { sendEmail } from "@/lib/email"

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

  const { type } = body as { type?: string }
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  if (type === "message") {
    const { conversationId } = body as { conversationId?: string }
    if (!conversationId) {
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

    const recipientId = conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a

    const [senderProfile, recipientUser] = await Promise.all([
      adminClient.from("profiles").select("display_name").eq("id", user.id).single(),
      adminClient.auth.admin.getUserById(recipientId),
    ])

    const recipientEmail = recipientUser.data.user?.email
    if (!recipientEmail) {
      return NextResponse.json({ success: true })
    }

    const senderName = senderProfile.data?.display_name ?? "Someone"

    await sendEmail({
      to: recipientEmail,
      subject: `New message from ${senderName} on RealReach Agency`,
      html: `<p>${senderName} sent you a new message on RealReach Agency.</p><p><a href="${origin}/messages/${conversationId}">View the conversation</a></p>`,
    })

    return NextResponse.json({ success: true })
  }

  if (type === "application") {
    const { jobId } = body as { jobId?: string }
    if (!jobId) {
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
    if (!brandEmail) {
      return NextResponse.json({ success: true })
    }

    const creatorName = creatorProfile?.display_name ?? "A creator"

    await sendEmail({
      to: brandEmail,
      subject: `${creatorName} applied to "${job.title}" on RealReach Agency`,
      html: `<p>${creatorName} just applied to your job <strong>${job.title}</strong> on RealReach Agency.</p><p><a href="${origin}/brand/jobs/${jobId}/applications">Review the application</a></p>`,
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown notification type" }, { status: 400 })
}
