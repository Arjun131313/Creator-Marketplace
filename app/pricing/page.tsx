import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { PLATFORM_FEE_BPS } from "@/lib/stripe"

const FEE_PERCENT = PLATFORM_FEE_BPS / 100
const EXAMPLE_BUDGET = 300
const EXAMPLE_FEE = Math.round((EXAMPLE_BUDGET * PLATFORM_FEE_BPS) / 10_000)
const EXAMPLE_PAYOUT = EXAMPLE_BUDGET - EXAMPLE_FEE

const FAQS = [
  {
    q: "Is there really no subscription?",
    a: "Correct. Browsing, posting a brief, messaging, and building a creator profile all cost nothing. You only pay the platform fee on a job that actually completes and gets paid out.",
  },
  {
    q: "What if I post a brief and nobody applies?",
    a: "You've paid nothing, so there's nothing to refund — you can edit the brief, boost the budget, or reach out to creators directly at no extra cost.",
  },
  {
    q: "Does the fee change based on job size?",
    a: `No — it's a flat ${FEE_PERCENT}% on the job's agreed fee, whether that's £50 or £5,000.`,
  },
  {
    q: "Is Creator Academy priced the same way?",
    a: `Yes. Teachers set their own lesson price, and RealReach takes the same ${FEE_PERCENT}% on each sale — no separate pricing model to learn.`,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      {/* Hero */}
      <section className="bg-[#10141b] py-24 text-[#f5f3ee]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c8f23c]">Pricing</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            No subscription. Just a fee on what works.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#a8adb6]">
            Browsing, posting briefs, and messaging are free for everyone. We only get paid when you do.
          </p>
        </div>
      </section>

      {/* Worked example */}
      <section className="mx-auto max-w-4xl px-5 py-20 md:px-8">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">How the fee actually works</h2>
        <p className="mt-3 max-w-xl text-[#595e66]">
          One flat rate, taken from the job&apos;s fee when it&apos;s paid out — never billed separately, never upfront.
        </p>

        <div className="mt-10 border-2 border-[#10141b] bg-white">
          <div className="border-b-2 border-[#10141b] bg-[#1a54f0] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">Example: a £{EXAMPLE_BUDGET} brief</p>
            <p className="mt-1 font-display text-2xl font-extrabold">A brand hires a creator for £{EXAMPLE_BUDGET}</p>
          </div>
          <div className="divide-y-2 divide-[#10141b]/10">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="font-bold text-[#10141b]">Brand pays</p>
                <p className="mt-1 text-sm text-[#595e66]">Held in escrow the moment the creator is hired</p>
              </div>
              <p className="font-display text-2xl font-extrabold text-[#10141b]">£{EXAMPLE_BUDGET.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="font-bold text-[#10141b]">Platform fee ({FEE_PERCENT}%)</p>
                <p className="mt-1 text-sm text-[#595e66]">Taken only when the job pays out — never upfront</p>
              </div>
              <p className="font-display text-2xl font-extrabold text-[#ff534b]">–£{EXAMPLE_FEE.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between bg-[#c8f23c]/15 p-6">
              <div>
                <p className="font-bold text-[#182704]">Creator receives</p>
                <p className="mt-1 text-sm text-[#595e66]">Paid out the moment the work is approved</p>
              </div>
              <p className="font-display text-2xl font-extrabold text-[#182704]">£{EXAMPLE_PAYOUT.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison-style callout */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-5">
          <div className="grid gap-px border border-[#10141b]/10 bg-[#10141b]/10 sm:grid-cols-3">
            <div className="bg-[#f5f3ee] p-7">
              <p className="font-display text-3xl font-extrabold">£0</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">To browse or post a brief</p>
            </div>
            <div className="bg-[#f5f3ee] p-7">
              <p className="font-display text-3xl font-extrabold">£0</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Minimum spend, ever</p>
            </div>
            <div className="bg-[#f5f3ee] p-7">
              <p className="font-display text-3xl font-extrabold">{FEE_PERCENT}%</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Flat fee, only on jobs that pay out</p>
            </div>
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-6 text-[#595e66]">
            Some platforms charge a monthly subscription before you&apos;ve hired anyone — a real cost even if nothing comes of it. RealReach doesn&apos;t: you commit nothing until a job actually completes.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">
        <h2 className="font-display text-3xl font-extrabold">Pricing questions</h2>
        <div className="mt-8 divide-y-2 divide-[#10141b]/10 border-y-2 border-[#10141b]/10">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-7">
              <p className="font-bold text-[#10141b]">{faq.q}</p>
              <p className="mt-2 text-sm leading-6 text-[#595e66]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#10141b] py-24 text-[#f5f3ee]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Nothing to sign up for except an account.</h2>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="border-2 border-[#10141b] bg-[#1a54f0] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Sign up as a brand
            </Link>
            <Link
              href="/signup"
              className="border-2 border-[#f5f3ee]/40 px-8 py-4 text-sm font-bold text-[#f5f3ee] transition-colors hover:border-[#f5f3ee]"
            >
              Join as a creator
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#10141b]/10 bg-[#10141b] px-5 py-12 text-[#a8adb6]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f5f3ee]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/how-it-works" className="hover:text-[#f5f3ee]">How it Works</Link>
            <Link href="/help" className="hover:text-[#f5f3ee]">Help Center</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
