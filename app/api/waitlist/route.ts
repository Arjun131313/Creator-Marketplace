import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { sendEmail } from "@/lib/email"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { full_name, email, platform, handle, followers, niche } = body as {
    full_name?: string
    email?: string
    platform?: string
    handle?: string
    followers?: string
    niche?: string
  }

  const name = full_name?.trim()
  const trimmedEmail = email?.trim().toLowerCase()

  if (!name || !trimmedEmail || !platform) {
    return NextResponse.json({ error: "Name, email, and platform are required." }, { status: 400 })
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { error: insertError } = await adminClient.from("creator_waitlist").insert({
    full_name: name,
    email: trimmedEmail,
    platform,
    handle: handle?.trim() || null,
    followers: followers?.trim() || null,
    niche: niche?.trim() || null,
  })

  // Unique violation just means they're already on the list — treat as success.
  if (insertError && insertError.code !== "23505") {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  if (!insertError) {
    await sendEmail({
      to: trimmedEmail,
      subject: "You're on the RealReach Agency creator waitlist",
      html: `<p>Hi ${name},</p><p>Thanks for joining the RealReach Agency creator waitlist. We're onboarding our founding cohort by hand — we'll be in touch personally once there's a spot for you.</p>`,
    })

    const notifyEmail = process.env.WAITLIST_NOTIFY_EMAIL
    if (notifyEmail) {
      await sendEmail({
        to: notifyEmail,
        subject: `New waitlist signup: ${name}`,
        html: `
          <p>New creator waitlist signup:</p>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${trimmedEmail}</li>
            <li><strong>Platform:</strong> ${platform}</li>
            <li><strong>Handle:</strong> ${handle?.trim() || "—"}</li>
            <li><strong>Followers:</strong> ${followers?.trim() || "—"}</li>
            <li><strong>Niche:</strong> ${niche?.trim() || "—"}</li>
          </ul>
        `,
      })
    }
  }

  return NextResponse.json({ success: true })
}
