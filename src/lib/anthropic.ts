const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

type BriefInputs = {
  title: string
  contentType?: string
  platform?: string
  videoDuration?: string
  talkingPoints?: string
}

type GenerateBriefResult =
  | { ok: true; description: string }
  | { ok: false; reason: string }

// Drafts a job description from a brand's structured brief inputs. No-ops
// with a clear reason (not a thrown error) when ANTHROPIC_API_KEY isn't
// configured, matching the sendEmail() pattern in ./email.ts.
export async function generateJobBrief(inputs: BriefInputs): Promise<GenerateBriefResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return { ok: false, reason: "ANTHROPIC_API_KEY not set" }
  }

  const details = [
    inputs.contentType ? `Content type: ${inputs.contentType}` : null,
    inputs.platform ? `Platform: ${inputs.platform}` : null,
    inputs.videoDuration ? `Duration: ${inputs.videoDuration}` : null,
    inputs.talkingPoints ? `Key talking points: ${inputs.talkingPoints}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const prompt = `Write a clear, concise creative brief description for a UK micro-influencer marketing job, to be read by creators deciding whether to apply.

Job title: ${inputs.title}
${details || "(no further details provided)"}

Write 2-4 short paragraphs covering: what the brand wants, what the creator should deliver, and any tone/style guidance. Do not invent specific facts (brand name, exact product details, budget) that weren't given — write generically where details are missing. Return only the brief text, no headings, no preamble.`

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error("[anthropic] Failed to generate brief:", body)
    return { ok: false, reason: "Anthropic API request failed" }
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] }
  const description = data.content?.find((block) => block.type === "text")?.text?.trim()

  if (!description) {
    return { ok: false, reason: "Anthropic returned an empty response" }
  }

  return { ok: true, description }
}
