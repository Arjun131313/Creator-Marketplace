import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"

const REPLACES = [
  "Email chains nobody can find later",
  "WhatsApp threads mixed in with your personal chats",
  "Instagram and TikTok DMs that vanish into request folders",
  "Spreadsheets tracking who owes what",
]

const CAPABILITIES = [
  {
    title: "One thread per working relationship",
    body: "Every brand–creator pair gets a single conversation that persists across jobs. Come back six months later and the whole history is still there — what was agreed, what changed, what was delivered.",
  },
  {
    title: "The money status sits in the conversation",
    body: "When a payment goes into escrow, a banner appears right in the thread showing the amount held. When it's released, that updates too. Nobody has to ask \"has this been paid yet?\" — it's visible where the conversation is already happening.",
  },
  {
    title: "Unread counts that mean something",
    body: "Your inbox shows exactly how many messages are waiting per conversation, not a vague dot. Read a thread and it clears itself.",
  },
  {
    title: "Talk before you commit",
    body: "Message a creator from their profile before hiring them — no obligation, no application required first. Brands can sound someone out, creators can ask about a brief.",
  },
]

export default function MessagesFeaturePage() {
  return (
    <div className="min-h-screen bg-[#f1f3f7] text-[#0d1117]">
      <PublicNav />

      {/* Hero */}
      <section className="bg-[#0d1117] py-24 text-[#f1f3f7]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c8f23c]">Messages</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            Every conversation, and the money, in one place.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#8891a3]">
            Brief, negotiate, deliver, and get paid without the thread scattering across four apps. Escrow status shows up
            right inside the conversation it belongs to.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-block rounded-[8px] bg-[#16255c] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* What it replaces */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Stop running a campaign out of four different apps.
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-[#5b6472]">
              Most creator work falls apart in the admin, not the content. A rate agreed in a DM, a revision requested over
              email, an invoice chased on WhatsApp — then someone leaves and nobody can reconstruct what was agreed.
            </p>
            <p className="mt-4 max-w-lg leading-7 text-[#5b6472]">
              On RealReach the conversation and the transaction are the same record.
            </p>
          </div>

          <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05]">
            <p className="border-b border-[#0d1117]/[0.07] bg-[#ff534b] p-5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
              What this replaces
            </p>
            <ul className="divide-y divide-[#0d1117]/[0.07]">
              {REPLACES.map((r) => (
                <li key={r} className="flex items-center gap-3 p-5 text-sm text-[#5b6472]">
                  <span className="font-display text-lg font-extrabold text-[#ff534b]">✕</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">What&apos;s in the inbox</h2>
          <div className="mt-10 grid gap-px border border-[#0d1117]/10 bg-[#0d1117]/10 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="bg-white p-7">
                <h3 className="font-display text-xl font-extrabold">{c.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5b6472]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escrow callout */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
        <div className="rounded-[8px] bg-[#c8f23c]/15 p-10">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#101a3d]">Why it matters</p>
          <h2 className="mt-3 max-w-3xl font-display text-2xl font-extrabold sm:text-3xl">
            The most common argument in creator work is &ldquo;when am I getting paid?&rdquo; — so we put the answer in the thread.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5b6472]">
            Once a brand hires a creator, the escrowed amount appears as a banner in their conversation and updates the
            moment it&apos;s released. Both sides are looking at the same status, in the same place they&apos;re already talking.
            No screenshots of payment confirmations, no chasing.
          </p>
          <Link href="/how-it-works" className="mt-6 inline-block text-sm font-bold text-[#16255c] hover:underline">
            See how escrow works →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0d1117] py-24 text-[#f1f3f7]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Start a conversation.</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#8891a3]">
            Message a creator before you hire, or reply to a brand before you apply. Free either way.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/creators"
              className="rounded-[8px] bg-[#16255c] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Browse creators
            </Link>
            <Link
              href="/signup"
              className="border border-white/25 px-8 py-4 text-sm font-bold text-[#f1f3f7] transition-colors hover:border-[#f1f3f7]"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#0d1117]/10 bg-[#0d1117] px-5 py-12 text-[#8891a3]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f1f3f7]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/how-it-works" className="hover:text-[#f1f3f7]">How it Works</Link>
            <Link href="/pricing" className="hover:text-[#f1f3f7]">Pricing</Link>
            <Link href="/help" className="hover:text-[#f1f3f7]">Help Center</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
