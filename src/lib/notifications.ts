import { createAdminClient } from "@/lib/supabase"
import { sendEmail } from "@/lib/email"

type AdminClient = ReturnType<typeof createAdminClient>

// Server-side notifications.
//
// These are called from webhooks, cron, and API routes rather than from the
// browser, so events the user isn't present for — a payment releasing, a
// dispute being raised, a subscription lapsing — still reach people. Every
// function is fire-and-forget: a failed email must never roll back the
// business action that triggered it.

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://creator-marketplace-eight.vercel.app"
}

/** Escapes interpolated values so a job title can't inject markup into an email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function formatMoney(amount: number): string {
  return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Wraps body copy in the RealReach shell. Kept deliberately plain — table-free,
 * inline-styled, no images — so it renders the same everywhere and never trips
 * spam heuristics on a domain with no sending reputation yet.
 */
function layout(opts: { heading: string; body: string; cta?: { label: string; href: string } }): string {
  const button = opts.cta
    ? `<p style="margin:28px 0 0"><a href="${opts.cta.href}" style="background:#16255c;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:700;display:inline-block">${escapeHtml(opts.cta.label)}</a></p>`
    : ""

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f1f3f7;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px">
    <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:#0d1117;letter-spacing:-0.02em">RealReach.</p>
    <h1 style="margin:0 0 14px;font-size:22px;font-weight:800;color:#0d1117;line-height:1.3">${escapeHtml(opts.heading)}</h1>
    <div style="font-size:15px;line-height:1.6;color:#5b6472">${opts.body}</div>
    ${button}
  </div>
  <p style="max-width:520px;margin:20px auto 0;font-size:12px;color:#8b93a3;text-align:center">
    You're receiving this because you have a RealReach account.
  </p>
</div>`
}

async function emailFor(adminClient: AdminClient, userId: string): Promise<string | null> {
  const { data } = await adminClient.auth.admin.getUserById(userId)
  return data.user?.email ?? null
}

async function nameFor(adminClient: AdminClient, userId: string, fallback: string): Promise<string> {
  const { data } = await adminClient.from("profiles").select("display_name").eq("id", userId).single()
  return data?.display_name ?? fallback
}

/**
 * Sends without ever throwing into the caller. A notification failing is worth
 * a log line, not a failed payment release or a 500 on a webhook Stripe will
 * then retry.
 */
async function deliver(to: string | null, subject: string, html: string): Promise<void> {
  if (!to) return
  try {
    const result = await sendEmail({ to, subject, html })
    if (!result.sent) {
      console.warn(`[notify] not sent to ${to} — ${result.reason}`)
    }
  } catch (error) {
    console.error(`[notify] threw while sending to ${to}:`, error)
  }
}

// ── Job lifecycle ────────────────────────────────────────────────────────────

/** The brand has paid — the creator is booked and the money is in escrow. */
export async function notifyCreatorHired(
  adminClient: AdminClient,
  opts: { creatorId: string; brandId: string; jobId: string; jobTitle: string; amount: number },
) {
  const [to, brandName] = await Promise.all([
    emailFor(adminClient, opts.creatorId),
    nameFor(adminClient, opts.brandId, "A brand"),
  ])

  await deliver(
    to,
    `You've been hired for "${opts.jobTitle}"`,
    layout({
      heading: `${brandName} hired you`,
      body: `<p style="margin:0 0 12px">You're booked for <strong style="color:#0d1117">${escapeHtml(opts.jobTitle)}</strong>.</p>
             <p style="margin:0">${formatMoney(opts.amount)} is now held in escrow. It's released to you once your content is approved, or automatically after 7 days if the brand doesn't review it.</p>`,
      cta: { label: "Open the job", href: `${appUrl()}/creator/jobs/${opts.jobId}` },
    }),
  )
}

/** Money has left escrow and is on its way to the creator's bank. */
export async function notifyPaymentReleased(
  adminClient: AdminClient,
  opts: { creatorId: string; jobTitle: string; amount: number; platformFee: number },
) {
  const to = await emailFor(adminClient, opts.creatorId)
  const net = opts.amount - opts.platformFee

  await deliver(
    to,
    `You've been paid ${formatMoney(net)}`,
    layout({
      heading: "Your payment has been released",
      body: `<p style="margin:0 0 12px"><strong style="color:#0d1117">${escapeHtml(opts.jobTitle)}</strong> is complete and the money is on its way to your bank.</p>
             <p style="margin:0">${formatMoney(opts.amount)} agreed, less ${formatMoney(opts.platformFee)} platform fee — <strong style="color:#0d1117">${formatMoney(net)}</strong> to you. Stripe payouts usually land within a couple of working days.</p>`,
      cta: { label: "See your earnings", href: `${appUrl()}/creator/dashboard` },
    }),
  )
}

/** A creator has submitted content and the brand needs to review it. */
export async function notifyContentSubmitted(
  adminClient: AdminClient,
  opts: { brandId: string; creatorId: string; jobId: string; jobTitle: string },
) {
  const [to, creatorName] = await Promise.all([
    emailFor(adminClient, opts.brandId),
    nameFor(adminClient, opts.creatorId, "A creator"),
  ])

  await deliver(
    to,
    `${creatorName} submitted content for "${opts.jobTitle}"`,
    layout({
      heading: "Content is ready to review",
      body: `<p style="margin:0 0 12px">${escapeHtml(creatorName)} submitted their work for <strong style="color:#0d1117">${escapeHtml(opts.jobTitle)}</strong>.</p>
             <p style="margin:0">Approve it to release payment, or request a revision. If you don't review it within 7 days the payment releases automatically.</p>`,
      cta: { label: "Review the content", href: `${appUrl()}/brand/jobs/${opts.jobId}/applications` },
    }),
  )
}

/** The brand has reviewed — approved, rejected, or asked for a revision. */
export async function notifyContentReviewed(
  adminClient: AdminClient,
  opts: {
    creatorId: string
    jobId: string
    jobTitle: string
    status: "approved" | "rejected" | "revision_requested"
    notes: string | null
  },
) {
  const to = await emailFor(adminClient, opts.creatorId)

  const copy = {
    approved: {
      subject: `Your content was approved — "${opts.jobTitle}"`,
      heading: "Your content was approved",
      body: "The brand approved your work. Payment is being released to you now.",
    },
    revision_requested: {
      subject: `Revision requested on "${opts.jobTitle}"`,
      heading: "The brand asked for a revision",
      body: "Have a look at their notes and resubmit when you're ready. Your payment stays held in escrow in the meantime.",
    },
    rejected: {
      subject: `Your submission for "${opts.jobTitle}" was rejected`,
      heading: "Your submission was rejected",
      body: "The brand rejected this submission. If you think that's wrong, raise a dispute from the job page and we'll review it.",
    },
  }[opts.status]

  const notes = opts.notes
    ? `<p style="margin:12px 0 0;padding:14px;background:#f1f3f7;border-radius:8px;color:#0d1117">${escapeHtml(opts.notes)}</p>`
    : ""

  await deliver(
    to,
    copy.subject,
    layout({
      heading: copy.heading,
      body: `<p style="margin:0">${copy.body}</p>${notes}`,
      cta: { label: "Open the job", href: `${appUrl()}/creator/jobs/${opts.jobId}` },
    }),
  )
}

/** A job application was accepted or rejected. */
export async function notifyApplicationDecision(
  adminClient: AdminClient,
  opts: { creatorId: string; jobId: string; jobTitle: string; accepted: boolean },
) {
  const to = await emailFor(adminClient, opts.creatorId)

  await deliver(
    to,
    opts.accepted
      ? `You're through for "${opts.jobTitle}"`
      : `Update on your application for "${opts.jobTitle}"`,
    layout({
      heading: opts.accepted ? "Your application was accepted" : "You weren't picked this time",
      body: opts.accepted
        ? `<p style="margin:0">The brand accepted your application for <strong style="color:#0d1117">${escapeHtml(opts.jobTitle)}</strong>. You'll get another email the moment they pay, which is when the job officially starts.</p>`
        : `<p style="margin:0">The brand went with someone else for <strong style="color:#0d1117">${escapeHtml(opts.jobTitle)}</strong>. There are other briefs open right now.</p>`,
      cta: opts.accepted
        ? { label: "Open the job", href: `${appUrl()}/creator/jobs/${opts.jobId}` }
        : { label: "Browse open briefs", href: `${appUrl()}/campaigns` },
    }),
  )
}

/** Somebody raised a dispute — the other party needs to know money is frozen. */
export async function notifyDisputeRaised(
  adminClient: AdminClient,
  opts: { recipientId: string; raisedByName: string; jobTitle: string; reason: string },
) {
  const to = await emailFor(adminClient, opts.recipientId)

  await deliver(
    to,
    `A dispute was raised on "${opts.jobTitle}"`,
    layout({
      heading: "A dispute was raised",
      body: `<p style="margin:0 0 12px">${escapeHtml(opts.raisedByName)} raised a dispute on <strong style="color:#0d1117">${escapeHtml(opts.jobTitle)}</strong>. The payment is frozen until it's resolved.</p>
             <p style="margin:0 0 4px;font-weight:700;color:#0d1117">Their reason</p>
             <p style="margin:0;padding:14px;background:#f1f3f7;border-radius:8px;color:#0d1117">${escapeHtml(opts.reason)}</p>
             <p style="margin:12px 0 0">We'll review the brief, the deliverables, and your messages, and aim to come back within 10 working days.</p>`,
    }),
  )
}

// ── Events ───────────────────────────────────────────────────────────────────

/** A brand accepted or declined a creator's request to attend an event. */
export async function notifyEventDecision(
  adminClient: AdminClient,
  opts: { creatorId: string; eventId: string; eventTitle: string; city: string; accepted: boolean },
) {
  const to = await emailFor(adminClient, opts.creatorId)

  await deliver(
    to,
    opts.accepted
      ? `You're in — ${opts.eventTitle}`
      : `Update on ${opts.eventTitle}`,
    layout({
      heading: opts.accepted ? "You're on the list" : "You didn't get a place this time",
      body: opts.accepted
        ? `<p style="margin:0">You've got a place at <strong style="color:#0d1117">${escapeHtml(opts.eventTitle)}</strong> in ${escapeHtml(opts.city)}. Full details, timings, and what to bring are on the event page.</p>`
        : `<p style="margin:0"><strong style="color:#0d1117">${escapeHtml(opts.eventTitle)}</strong> filled up. More events go up regularly — worth checking back.</p>`,
      cta: opts.accepted
        ? { label: "See the details", href: `${appUrl()}/events/${opts.eventId}` }
        : { label: "Browse events", href: `${appUrl()}/events` },
    }),
  )
}

/** A creator applied to attend a brand's event. */
export async function notifyEventApplication(
  adminClient: AdminClient,
  opts: { brandId: string; creatorId: string; eventId: string; eventTitle: string },
) {
  const [to, creatorName] = await Promise.all([
    emailFor(adminClient, opts.brandId),
    nameFor(adminClient, opts.creatorId, "A creator"),
  ])

  await deliver(
    to,
    `${creatorName} applied to ${opts.eventTitle}`,
    layout({
      heading: "New event application",
      body: `<p style="margin:0">${escapeHtml(creatorName)} applied to attend <strong style="color:#0d1117">${escapeHtml(opts.eventTitle)}</strong>.</p>`,
      cta: { label: "Review applicants", href: `${appUrl()}/brand/events/${opts.eventId}` },
    }),
  )
}

// ── Academy ──────────────────────────────────────────────────────────────────

/** Someone bought a creator's lesson. */
export async function notifyLessonSold(
  adminClient: AdminClient,
  opts: { teacherId: string; lessonTitle: string; amount: number; platformFee: number },
) {
  const to = await emailFor(adminClient, opts.teacherId)
  const net = opts.amount - opts.platformFee

  await deliver(
    to,
    `You sold "${opts.lessonTitle}"`,
    layout({
      heading: "You made a sale",
      body: `<p style="margin:0">Someone bought <strong style="color:#0d1117">${escapeHtml(opts.lessonTitle)}</strong>. ${formatMoney(opts.amount)} less ${formatMoney(opts.platformFee)} fee — <strong style="color:#0d1117">${formatMoney(net)}</strong> to you.</p>`,
      cta: { label: "See your lessons", href: `${appUrl()}/creator/academy` },
    }),
  )
}

// ── Billing ──────────────────────────────────────────────────────────────────

/** A brand's subscription payment failed — hiring is now blocked. */
export async function notifySubscriptionPastDue(
  adminClient: AdminClient,
  opts: { brandId: string; planName: string },
) {
  const to = await emailFor(adminClient, opts.brandId)

  await deliver(
    to,
    "Your RealReach payment didn't go through",
    layout({
      heading: "We couldn't take this month's payment",
      body: `<p style="margin:0">Your <strong style="color:#0d1117">${escapeHtml(opts.planName)}</strong> payment failed, so hiring is paused. Your briefs, messages, and any job already in progress are unaffected.</p>`,
      cta: { label: "Update payment details", href: `${appUrl()}/brand/billing` },
    }),
  )
}
