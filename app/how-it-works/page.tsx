import Link from "next/link"
import PublicNav from "@/components/public-nav"

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
    <div className="min-h-screen bg-[#f5f1e8] text-[#18140f]">
      <PublicNav />

      {/* ── Hero (ink) ────────────────────────────────────────────────────── */}
      <section className="bg-[#18140f] py-24 text-[#f5f1e8]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#e8a37c]">
            Simple. Transparent. Effective.
          </p>
          <h1 className="mt-4 font-serif text-5xl font-medium tracking-tight sm:text-6xl">
            How RealReach Agency <em className="not-italic italic">works</em>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#b8afa0]">
            From posting a brief to approving content — we handle everything in between. Here&apos;s exactly how brands and microinfluencers work together on RealReach Agency.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-[2px] bg-[#c1440e] px-6 py-3 text-sm font-semibold text-[#fef8f2] transition-colors hover:bg-[#a23a0c]"
            >
              Get started free
            </Link>
            <Link
              href="/creators"
              className="rounded-[2px] border border-[#3a332a] px-6 py-3 text-sm font-semibold text-[#f5f1e8] transition-colors hover:border-[#e8a37c]"
            >
              Browse creators
            </Link>
          </div>
        </div>
      </section>

      {/* ── Photo banner (paper) ─────────────────────────────────────────── */}
      <div className="relative h-64 overflow-hidden bg-[#18140f]/5 sm:h-80">
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
              className={`flex flex-col gap-8 border-t border-[#18140f]/10 pt-10 lg:flex-row lg:items-start ${
                i % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Icon + number */}
              <div className="flex shrink-0 flex-col items-start gap-4 lg:w-48">
                <div className="flex h-14 w-14 items-center justify-center border border-[#18140f]/15 text-[#c1440e]">
                  {step.icon}
                </div>
                <p className="font-serif text-6xl leading-none text-[#18140f]/10">
                  {step.number}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">
                    Step {step.number}
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-medium">{step.title}</h2>
                  <p className="mt-0.5 text-sm font-medium text-[#6b6153]">{step.subtitle}</p>
                </div>
                <p className="leading-7 text-[#6b6153]">{step.description}</p>
                <ul className="space-y-2">
                  {step.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-[#6b6153]">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#c1440e]"
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
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">FAQ</p>
          <h2 className="mt-2 font-serif text-3xl font-medium">Common questions</h2>
        </div>
        <div className="divide-y divide-[#18140f]/10 border-y border-[#18140f]/10">
          {faqs.map((faq) => (
            <div key={faq.q} className="py-7">
              <p className="font-semibold text-[#18140f]">{faq.q}</p>
              <p className="mt-2 text-sm leading-6 text-[#6b6153]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA (ink) ─────────────────────────────────────────────────────── */}
      <section className="bg-[#18140f] py-24 text-[#f5f1e8]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">Ready to get started?</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#b8afa0]">
            Join brands who use RealReach Agency to find and work with the best microinfluencers.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-[2px] bg-[#c1440e] px-8 py-4 text-sm font-semibold text-[#fef8f2] transition-colors hover:bg-[#a23a0c]"
            >
              Sign up as a brand
            </Link>
            <Link
              href="/signup"
              className="rounded-[2px] border border-[#3a332a] px-8 py-4 text-sm font-semibold text-[#f5f1e8] transition-colors hover:border-[#e8a37c]"
            >
              Join as a creator
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#3a332a] bg-[#18140f] px-6 py-10 text-[#8b8578]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6">
          <Link href="/" className="font-serif text-lg text-[#f5f1e8] transition hover:text-[#e8a37c]">
            Real<em className="not-italic italic text-[#e8a37c]">Reach</em>
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/creators" className="transition hover:text-[#f5f1e8]">Browse Creators</Link>
            <Link href="/how-it-works" className="transition hover:text-[#f5f1e8]">How it Works</Link>
            <Link href="/login" className="transition hover:text-[#f5f1e8]">Log in</Link>
            <Link href="/signup" className="transition hover:text-[#f5f1e8]">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
