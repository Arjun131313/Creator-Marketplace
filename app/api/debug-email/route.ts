import { NextRequest, NextResponse } from "next/server"

// Temporary diagnostic endpoint — confirms env vars are readable and shows
// Resend's raw response. Delete this file once email sending is confirmed
// working; it should never ship long-term even though it doesn't leak secrets.
export async function GET(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? "RealReach Agency <hello@realreachagency.com>"
  const to = request.nextUrl.searchParams.get("to") ?? "arjunmattu913@gmail.com"

  if (!apiKey) {
    return NextResponse.json({ apiKeyPresent: false, from })
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Debug test",
      html: "<p>Debug test</p>",
    }),
  })

  const body = await response.text()

  return NextResponse.json({
    apiKeyPresent: true,
    apiKeyLength: apiKey.length,
    from,
    to,
    resendStatus: response.status,
    resendBody: body,
  })
}
