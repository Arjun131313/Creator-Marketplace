const RESEND_API_URL = "https://api.resend.com/emails"

type SendEmailArgs = {
  to: string
  subject: string
  html: string
}

type SendEmailResult =
  | { sent: true; status: number }
  | { sent: false; reason: string; status?: number; body?: string }

// Fires a transactional email via Resend. No-ops (with a console warning) when
// RESEND_API_KEY isn't configured, so notifications stay optional until the
// account is set up rather than breaking messaging/applications.
export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? "RealReach Agency <hello@realreachagency.com>"

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped email to ${to}: ${subject}`)
    return { sent: false, reason: "RESEND_API_KEY not set" }
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`[email] Failed to send to ${to}:`, body)
    return { sent: false, reason: "Resend rejected the request", status: response.status, body }
  }

  return { sent: true, status: response.status }
}
