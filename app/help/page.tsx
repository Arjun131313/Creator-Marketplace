import Link from "next/link"
import PublicNav from "@/components/public-nav"

const SECTIONS = [
  {
    title: "Getting started",
    items: [
      {
        q: "How do I sign up as a brand or a creator?",
        a: "Go to Sign up and choose Brand or Creator. Brands can post a job brief right away; creators are guided through profile setup (bio, niche, platform stats, and packages) before appearing in search.",
      },
      {
        q: "How long does it take to find a creator?",
        a: "Most brands receive their first applications within 24–48 hours of posting a job. You can also browse and message creators directly instead of waiting.",
      },
      {
        q: "What types of content can I commission?",
        a: "Sponsored posts, UGC videos, product reviews, Reels, Stories, live streams, brand partnerships, and affiliate campaigns — across Instagram, TikTok, and Snapchat.",
      },
    ],
  },
  {
    title: "Payments & pricing",
    items: [
      {
        q: "Is RealReach Agency free to use?",
        a: "Browsing and messaging creators is free. A platform fee applies only when a job is successfully completed. There's no monthly subscription.",
      },
      {
        q: "How does pricing work for creators?",
        a: "Creators publish Basic, Standard, and Premium packages on their profile, or you can negotiate a custom rate directly in the app.",
      },
      {
        q: "When does the creator actually get paid?",
        a: "Funds are held in escrow when you hire a creator. They're released once you approve the delivered content, or automatically after the review window closes if no revision or dispute is raised.",
      },
      {
        q: "What if I'm not happy with the content?",
        a: "You can request revisions before approving. If you and the creator can't agree, either of you can raise a dispute and our team will make a determination based on the original brief.",
      },
    ],
  },
  {
    title: "Messaging & working together",
    items: [
      {
        q: "Can I message a creator before hiring them?",
        a: "Yes — open any creator's profile and select \"Send a Message\" to start a conversation before committing to a job.",
      },
      {
        q: "I can't see messages from someone I'm talking to — what's wrong?",
        a: "This is usually a temporary sync issue. Try refreshing the conversation. If a specific conversation keeps failing to load, contact support with the other user's name and roughly when the conversation started.",
      },
    ],
  },
  {
    title: "Trust & safety",
    items: [
      {
        q: "How are creators verified?",
        a: "Creator profiles show platform follower counts, review history, and completed job counts so brands can evaluate track record before hiring.",
      },
      {
        q: "How do I report a problem with another user?",
        a: "Email us at hello@realreachagency.com with the other user's profile link and a description of the issue. For active disputes over a specific job, use the dispute option on that job instead so it's tied to the right records.",
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1a54f0]">Help Center</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          How can we help?
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-[#595e66]">
          Answers to common questions for brands and creators. Can&apos;t find what you need? Reach
          out and we&apos;ll get back to you.
        </p>

        <div className="mt-14 space-y-14">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-5 font-display text-2xl font-extrabold">{section.title}</h2>
              <div className="divide-y-2 divide-[#10141b]/10 border-y-2 border-[#10141b]/10">
                {section.items.map((item) => (
                  <div key={item.q} className="py-6">
                    <p className="font-bold text-[#10141b]">{item.q}</p>
                    <p className="mt-2 leading-7 text-[#595e66]">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 border-2 border-[#10141b] bg-white p-8 text-center">
          <h2 className="font-display text-2xl font-extrabold">Still need help?</h2>
          <p className="mx-auto mt-2 max-w-md text-[#595e66]">
            Email us and we&apos;ll get back to you as soon as we can.
          </p>
          <a
            href="mailto:hello@realreachagency.com"
            className="mt-6 inline-block border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            hello@realreachagency.com
          </a>
        </div>

        <p className="mt-10 text-sm">
          <Link href="/how-it-works" className="font-bold text-[#1a54f0] hover:underline">
            See the full how-it-works guide →
          </Link>
        </p>
      </main>

      <footer className="border-t-2 border-[#10141b]/10 bg-[#f5f3ee] px-6 py-10 text-[#595e66]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6">
          <Link href="/" className="font-display text-lg font-extrabold text-[#10141b] transition hover:text-[#1a54f0]">
            RealReach.
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/terms" className="transition hover:text-[#10141b]">Terms</Link>
            <Link href="/privacy" className="transition hover:text-[#10141b]">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
