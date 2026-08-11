import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"

const steps = [
  {
    number: "01",
    title: "Post a brief",
    subtitle: "Tell creators what you need",
    description:
      "Create a detailed job brief with your campaign goals, target audience, deliverables, budget, and timeline. The more detail you provide, the better proposals you'll receive.",
    points: [
      "Specify the platform — Instagram, TikTok, Snapchat, or multiple",
      "Set your budget and deadline upfront",
      "Describe your brand, product, and campaign objectives",
      "Get matched to creators who fit your niche",
    ],
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Browse & hire creators",
    subtitle: "Find your perfect match",
    description:
      "Explore our curated marketplace of verified creators. Filter by niche, platform, follower count, content type, availability, and budget. Review portfolios, past work, and brand reviews before reaching out.",
    points: [
      "Filter by Instagram, TikTok, or Snapchat creators",
      "Read genuine reviews from other brands",
      "View portfolio content directly on profiles",
      "Message creators before committing",
    ],
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Hire & pay securely",
    subtitle: "Protected payments, every time",
    description:
      "Once you've found the right creator, accept their application and make payment through our secure escrow system. Funds are held safely until you approve the delivered content.",
    points: [
      "Payments held in escrow until work is approved",
      "No money leaves until you're satisfied",
      "Dispute resolution support if needed",
      "Creator paid instantly on approval",
    ],
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Review & approve content",
    subtitle: "Quality control built in",
    description:
      "Creators submit their content through the platform. You review everything before it goes live — request revisions if needed, then approve and release payment. Leave a review to help future brands.",
    points: [
      "Review content before it's published",
      "Request revisions with clear feedback",
      "Approve and release payment in one click",
      "Leave a review to build creator accountability",
    ],
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
]

const faqs = [
  {
    q: "How long does it take to find a creator?",
    a: "Most brands receive their first applications within 24–48 hours of posting a job. You can also browse and reach out to creators directly.",
  },
  {
    q: "What if I'm not happy with the content?",
    a: "You can request revisions before approving. If a dispute arises, our support team steps in. Payment is never released until you're satisfied.",
  },
  {
    q: "How does pricing work for creators?",
    a: "Creators set their own packages starting from Basic, Standard, and Premium tiers. You can also negotiate custom rates directly in the app.",
  },
  {
    q: "Is RealReach Agency free to use?",
    a: "Browsing and messaging creators is free. A platform fee applies only when a job is successfully completed. No monthly subscription needed.",
  },
  {
    q: "What types of content can I commission?",
    a: "Sponsored posts, UGC videos, product reviews, Reels, Stories, live streams, brand partnerships, and affiliate campaigns — across Instagram, TikTok, and Snapchat.",
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      {/* ── Hero (ink) ────────────────────────────────────────────────────── */}
      <section className="bg-[#10141b] py-24 text-[#f5f3ee]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c8f23c]">
            Simple. Transparent. Effective.
          </p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            How RealReach works.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#a8adb6]">
            From posting a brief to approving content — we handle everything in between. Here&apos;s exactly how brands and microinfluencers work together on RealReach.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Get started free
            </Link>
            <Link
              href="/creators"
              className="border-2 border-[#f5f3ee]/40 px-6 py-3 text-sm font-bold text-[#f5f3ee] transition-colors hover:border-[#f5f3ee]"
            >
              Browse creators
            </Link>
          </div>
        </div>
      </section>

      {/* ── Photo banner (paper) ─────────────────────────────────────────── */}
      <div className="relative h-64 overflow-hidden border-b-2 border-[#10141b] sm:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-vlogger.jpg"
          alt="A creator recording video content with a ring light and smartphone"
          className="h-full w-full object-cover"
        />
      </div>

      {/* ── Steps (paper) ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24 md:px-8">
        <div className="space-y-16">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col gap-8 border-t-2 border-[#10141b]/10 pt-10 lg:flex-row lg:items-start ${
                i % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Icon + number */}
              <div className="flex shrink-0 flex-col items-start gap-4 lg:w-48">
                <div className="flex h-14 w-14 items-center justify-center border-2 border-[#10141b] text-[#1a54f0]">
                  {step.icon}
                </div>
                <p className="font-display text-6xl font-extrabold leading-none text-[#10141b]/10">
                  {step.number}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1a54f0]">
                    Step {step.number}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold">{step.title}</h2>
                  <p className="mt-0.5 text-sm font-bold text-[#595e66]">{step.subtitle}</p>
                </div>
                <p className="leading-7 text-[#595e66]">{step.description}</p>
                <ul className="space-y-2">
                  {step.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-[#595e66]">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#1a54f0]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ (paper) ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-24 md:px-8">
        <div className="mb-10">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1a54f0]">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Common questions</h2>
        </div>
        <div className="divide-y-2 divide-[#10141b]/10 border-y-2 border-[#10141b]/10">
          {faqs.map((faq) => (
            <div key={faq.q} className="py-7">
              <p className="font-bold text-[#10141b]">{faq.q}</p>
              <p className="mt-2 text-sm leading-6 text-[#595e66]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA (ink) ─────────────────────────────────────────────────────── */}
      <section className="bg-[#10141b] py-24 text-[#f5f3ee]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Ready to get started?</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#a8adb6]">
            Join brands who use RealReach to find and work with the best microinfluencers.
          </p>
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
            <Link href="/creators" className="hover:text-[#f5f3ee]">Browse Creators</Link>
            <Link href="/help" className="hover:text-[#f5f3ee]">Help Center</Link>
            <Link href="/terms" className="hover:text-[#f5f3ee]">Terms</Link>
            <Link href="/privacy" className="hover:text-[#f5f3ee]">Privacy</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
