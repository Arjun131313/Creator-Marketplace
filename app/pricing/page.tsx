import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { PLATFORM_FEE_BPS } from "@/lib/stripe"
import { PUBLIC_PLANS } from "@/lib/plans"

const CREATOR_FEE_PERCENT = PLATFORM_FEE_BPS / 100
const EXAMPLE_BUDGET = 300
const EXAMPLE_FEE = Math.round((EXAMPLE_BUDGET * PLATFORM_FEE_BPS) / 10_000)
const EXAMPLE_PAYOUT = EXAMPLE_BUDGET - EXAMPLE_FEE

// Prices and hire limits come from src/lib/plans.ts — the same module the
// checkout and the hire gate read — so this page can't advertise a number the
// product doesn't actually charge or enforce. Only presentation lives here.
const PRESENTATION: Record<string, { accent: string; cta: string; ctaHref: string }> = {
  starter: { accent: "bg-[#feb930] text-[#2b1d00]", cta: "Get started", ctaHref: "/brand/billing" },
  basic: { accent: "bg-[#ff534b] text-white", cta: "Get started", ctaHref: "/brand/billing" },
  pro: { accent: "bg-[#16255c] text-white", cta: "Get started", ctaHref: "/brand/billing" },
  enterprise: {
    accent: "bg-[#0d1117] text-[#f1f3f7]",
    cta: "Talk to us",
    ctaHref: "mailto:hello@realreachagency.com?subject=RealReach%20Enterprise%20enquiry",
  },
}

const TIERS = PUBLIC_PLANS.map((plan) => ({
  name: plan.name,
  price: plan.price,
  unit: plan.priceInPence !== null ? "/month" : undefined,
  hires: plan.hires,
  ...PRESENTATION[plan.id],
}))

const SHARED_FEATURES = [
  "Unlimited briefs and unlimited revisions",
  "Every payment held in escrow until you approve",
  "Content usage rights transfer to you on release",
  "AI-assisted brief drafting",
  "Dispute resolution on any job",
]

const FAQS = [
  {
    q: "Who pays the subscription — brands or creators?",
    a: "Brands only. Creators never pay a subscription to use RealReach, and never pay to browse briefs, apply, or build a profile.",
  },
  {
    q: `What does the ${CREATOR_FEE_PERCENT}% fee apply to?`,
    a: `It's deducted from a creator's payout when a job is released — so on a £100 job, the creator receives £${100 - CREATOR_FEE_PERCENT}. That's the only fee a creator ever pays. It's not charged on top of what the brand pays.`,
  },
  {
    q: "What counts as a hire?",
    a: "Accepting a creator's application on a brief and paying into escrow. Posting a brief, messaging creators, and browsing profiles don't count against your monthly allowance.",
  },
  {
    q: "Can I cancel whenever I want?",
    a: "Yes — plans are month-to-month with no minimum term. Any job already in escrow completes normally after you cancel.",
  },
  {
    q: "Is Creator Academy included?",
    a: `Academy lessons are sold individually by the creators who publish them and aren't part of a brand subscription. The same ${CREATOR_FEE_PERCENT}% fee applies to a teacher's earnings on each sale.`,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f1f3f7] text-[#0d1117]">
      <PublicNav />

      {/* Hero */}
      <section className="bg-[#0d1117] py-24 text-[#f1f3f7]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c8f23c]">Pricing</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            Pick the plan that fits your volume.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#8891a3]">
            Month-to-month, cancel any time. Everything below is what a <strong className="text-[#f1f3f7]">brand</strong> pays
            — creators pay nothing to join, and only a flat {CREATOR_FEE_PERCENT}% on what they earn.
          </p>
        </div>
      </section>

      {/* Tier grid */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((tier) => (
            <div key={tier.name} className="flex flex-col rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05]">
              <div className={`border-b border-[#0d1117]/[0.07] p-6 ${tier.accent}`}>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] opacity-80">{tier.name}</p>
                <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">
                  {tier.price}
                  {tier.unit ? <span className="text-lg font-bold opacity-70">{tier.unit}</span> : null}
                </p>
                <p className="mt-2 text-xs font-bold opacity-80">Month to month. Cancel any time.</p>
              </div>

              <div className="flex-1 divide-y divide-[#0d1117]/[0.07]">
                <div className="p-6">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b93a3]">
                    What the brand pays for
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#0d1117]">
                    <li className="flex gap-2">
                      <span className="text-[#16255c]">✓</span>
                      <span>
                        Up to <strong>{tier.hires}</strong> per month
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#16255c]">✓</span>
                      <span>Unlimited content per hire</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b93a3]">
                    What the creator pays
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#0d1117]">
                    <li className="flex gap-2">
                      <span className="text-[#16255c]">✓</span>
                      <span>
                        A flat <strong>{CREATOR_FEE_PERCENT}%</strong> on their payout
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#16255c]">✓</span>
                      <span>No subscription, ever</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b93a3]">Included</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#5b6472]">
                    {SHARED_FEATURES.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-[#16255c]">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-[#0d1117]/[0.07] p-6">
                <Link
                  href={tier.ctaHref}
                  className="block w-full rounded-[8px] bg-[#16255c] px-5 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-sided fee explainer */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Who pays what</h2>
          <p className="mt-3 max-w-xl text-[#5b6472]">
            Two sides, two very different bills. Here&apos;s a £{EXAMPLE_BUDGET} job on any plan.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[16px] bg-[#f7f8fa]">
              <div className="border-b border-[#0d1117]/[0.07] bg-[#16255c] p-5 text-white">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] opacity-80">The brand</p>
                <p className="mt-1 font-display text-2xl font-extrabold">Subscription + the job fee</p>
              </div>
              <div className="divide-y divide-[#0d1117]/[0.07]">
                <div className="flex items-center justify-between p-5">
                  <p className="text-sm text-[#5b6472]">Monthly plan</p>
                  <p className="font-display text-lg font-extrabold">From £49.99</p>
                </div>
                <div className="flex items-center justify-between p-5">
                  <p className="text-sm text-[#5b6472]">This job</p>
                  <p className="font-display text-lg font-extrabold">£{EXAMPLE_BUDGET}</p>
                </div>
                <div className="p-5">
                  <p className="text-xs text-[#8b93a3]">
                    No percentage added on top of the job fee — what you agree with the creator is what leaves your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] bg-[#f7f8fa]">
              <div className="border-b border-[#0d1117]/[0.07] bg-[#c8f23c] p-5 text-[#101a3d]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] opacity-80">The creator</p>
                <p className="mt-1 font-display text-2xl font-extrabold">A flat {CREATOR_FEE_PERCENT}%. Nothing else.</p>
              </div>
              <div className="divide-y divide-[#0d1117]/[0.07]">
                <div className="flex items-center justify-between p-5">
                  <p className="text-sm text-[#5b6472]">Job value</p>
                  <p className="font-display text-lg font-extrabold">£{EXAMPLE_BUDGET}</p>
                </div>
                <div className="flex items-center justify-between p-5">
                  <p className="text-sm text-[#5b6472]">RealReach fee ({CREATOR_FEE_PERCENT}%)</p>
                  <p className="font-display text-lg font-extrabold text-[#ff534b]">–£{EXAMPLE_FEE}</p>
                </div>
                <div className="flex items-center justify-between bg-[#c8f23c]/20 p-5">
                  <p className="text-sm font-bold text-[#101a3d]">Creator receives</p>
                  <p className="font-display text-lg font-extrabold text-[#101a3d]">£{EXAMPLE_PAYOUT}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">
        <h2 className="font-display text-3xl font-extrabold">Pricing questions</h2>
        <div className="mt-8 divide-y divide-[#0d1117]/[0.07] border-y border-[#0d1117]/[0.07]">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-7">
              <p className="font-bold text-[#0d1117]">{faq.q}</p>
              <p className="mt-2 text-sm leading-6 text-[#5b6472]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0d1117] py-24 text-[#f1f3f7]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Creators join free. Always.</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#8891a3]">
            If you&apos;re a creator, none of the above applies to you — build a profile and start applying.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-[8px] bg-[#16255c] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Sign up as a brand
            </Link>
            <Link
              href="/signup"
              className="border border-white/25 px-8 py-4 text-sm font-bold text-[#f1f3f7] transition-colors hover:border-[#f1f3f7]"
            >
              Join free as a creator
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
            <Link href="/help" className="hover:text-[#f1f3f7]">Help Center</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
