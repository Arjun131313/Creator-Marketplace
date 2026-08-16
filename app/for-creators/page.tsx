"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { supabase } from "@/lib/supabase"

// Real, licensed images already used elsewhere in the app (creator card
// fallbacks) — not stock/scraped content, and not claiming to be a specific
// creator's actual work. Descriptions are generic industry examples of what
// gets made in each niche, not claims about real completed campaigns.
const CONTENT_EXAMPLES = [
  { niche: "Beauty", image: "/images/niche-beauty.jpg", examples: "Product reviews, GRWM routines, tutorials" },
  { niche: "Fitness", image: "/images/niche-fitness.jpg", examples: "Workout demos, supplement reviews, progress diaries" },
  { niche: "Food", image: "/images/niche-food.jpg", examples: "Recipe videos, taste tests, unboxings" },
  { niche: "Travel", image: "/images/niche-travel.jpg", examples: "Destination reviews, gear testing, day-in-the-life" },
  { niche: "Gaming", image: "/images/niche-gaming.jpg", examples: "Gameplay clips, hardware reviews, live reactions" },
]

const VALUE_PROPS = [
  {
    title: "No minimum followers",
    body: "There's no follower gate to join. Brands judge fit and past work, not just reach — good news if your audience is small but engaged.",
  },
  {
    title: "See the fee before you apply",
    body: "Every brief lists what it pays upfront. No exposure-only offers, no gifting-only briefs pretending to be paid work.",
  },
  {
    title: "Paid automatically, no chasing",
    body: "Once a brand approves your work, payment releases immediately — no invoicing back and forth. And if they go quiet, it releases automatically after 7 days.",
  },
  {
    title: "Teach what you know",
    body: "Once you've done a few jobs, publish a paid lesson in Creator Academy — pricing, pitching, whatever's worked for you. Same payout account, no extra setup.",
  },
]

type PathStep = {
  title: string
  tabLabel: string
  body: string
  icon: React.ReactNode
}

function ProfileIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function AcademyPathIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347M12 13.489a50.702 50.702 0 017.74-3.342M12 13.489a50.702 50.702 0 00-7.74-3.342M12 13.489V21m-8.955-9.303c.407-.15.83-.283 1.267-.397M20.955 11.697c-.407-.15-.83-.283-1.267-.397" />
    </svg>
  )
}

function ReviewPathIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function TopRatedIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35" />
    </svg>
  )
}

const PATH_STEPS: PathStep[] = [
  {
    tabLabel: "1. Build a Profile",
    title: "Build your profile — no gatekeeping",
    icon: <ProfileIcon />,
    body: "There's no admin approval queue and no follower minimum. Add your name, niche, an introduction, and link a few pieces of your best work, and you're visible to brands straight away. What gets you hired is real numbers and real reviews, not a badge we handed out.",
  },
  {
    tabLabel: "2. Creator Academy",
    title: "Learn in Creator Academy",
    icon: <AcademyPathIcon />,
    body: "Once you've got the basics down, browse paid lessons published by creators who've already done the work — how to pitch, how to price a brief, what actually gets you hired again. Anyone can teach a lesson once they've completed a few jobs.",
  },
  {
    tabLabel: "3. Apply & Get Reviewed",
    title: "Apply, deliver, get reviewed",
    icon: <ReviewPathIcon />,
    body: "Every brief you apply to shows the fee upfront. Once you're hired and deliver the work, the brand leaves a real review. There's no internal performance team scoring you behind the scenes — your public track record is the only score that matters here.",
  },
  {
    tabLabel: "4. Get Invited Directly",
    title: "Top-rated creators get invited directly",
    icon: <TopRatedIcon />,
    body: "Build up enough reviews and you'll earn the \"Top Rated\" badge on your profile. From there, brands can invite you straight to a brief instead of you having to apply — the same badge you'll see on other creators when you're browsing as a brand.",
  },
]

const FAQS = [
  {
    q: "Do I need a minimum number of followers?",
    a: "No. Build a profile with real follower counts and your platform, and start applying — brands see your actual numbers, not a gate you had to pass to be visible.",
  },
  {
    q: "When do I actually get paid?",
    a: "The moment a brand approves your submitted work, or automatically after 7 days if they haven't responded. Funds are held in escrow from the moment you're hired, so the money's already committed before you start.",
  },
  {
    q: "What if a brand rejects my work unfairly?",
    a: "Request clarification and resubmit — revisions are unlimited and free. If you genuinely can't agree, raise a dispute and it freezes the payment until we've reviewed the brief and the work.",
  },
]

export default function ForCreatorsPage() {
  const [creatorCount, setCreatorCount] = useState<number | null>(null)
  const [openJobCount, setOpenJobCount] = useState<number | null>(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [countRes, jobsCountRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "creator"),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
      ])
      if (!mounted) return
      setCreatorCount(countRes.count ?? 0)
      setOpenJobCount(jobsCountRes.count ?? 0)
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-[#f1f3f7] text-[#0d1117]">
      <PublicNav />

      {/* Hero */}
      <section className="bg-[#0d1117] py-24 text-[#f1f3f7]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c8f23c]">For Creators</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            Small audience. Serious money.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#8891a3]">
            Every brief shows the fee before you apply. No follower minimum, no exposure-only offers, paid automatically once your work&apos;s approved.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-[8px] bg-[#16255c] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Join free
            </Link>
            <Link
              href="/campaigns"
              className="border border-white/25 px-6 py-3 text-sm font-bold text-[#f1f3f7] transition-colors hover:border-[#f1f3f7]"
            >
              Browse open briefs first
            </Link>
          </div>
          <div className="mx-auto mt-14 grid max-w-lg grid-cols-2 gap-6 border-t border-[#f1f3f7]/15 pt-8">
            <div>
              <p className="font-display text-3xl font-extrabold">{creatorCount ?? "—"}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#8891a3]">Creators already on RealReach</p>
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold">{openJobCount ?? "—"}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#8891a3]">Open briefs right now</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content examples */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-5">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">The kind of content brands are after</h2>
          <p className="mt-3 max-w-xl text-[#5b6472]">
            A few of the niches already active on RealReach — the format is up to you and the brief.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CONTENT_EXAMPLES.map((c) => (
              <div key={c.niche} className="rounded-[16px] bg-[#f7f8fa]">
                <div className="relative aspect-[4/5] overflow-hidden border-b border-[#0d1117]/[0.07]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={`${c.niche} content example`} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 bg-[#c8f23c] px-2 py-1 text-[10px] font-bold uppercase text-[#101a3d]">
                    {c.niche}
                  </span>
                </div>
                <p className="p-4 text-xs leading-5 text-[#5b6472]">{c.examples}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm">
            <Link href="/creators" className="font-bold text-[#16255c] hover:underline">
              See real creator profiles →
            </Link>
          </p>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Why creators use RealReach</h2>
        <div className="mt-10 grid gap-px border border-[#0d1117]/10 bg-[#0d1117]/10 sm:grid-cols-2">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="bg-[#f1f3f7] p-7">
              <h3 className="font-display text-xl font-extrabold">{v.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5b6472]">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process summary */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Four steps to your first job</h2>
            <Link href="/how-it-works" className="text-sm font-bold text-[#16255c] hover:underline">
              See the full process →
            </Link>
          </div>
          <div className="mt-10 grid gap-px border border-[#0d1117]/10 bg-[#0d1117]/10 md:grid-cols-4">
            {[
              { n: "01", title: "Build a profile", body: "Real follower counts, your niche, your portfolio. No minimum to join." },
              { n: "02", title: "Apply to briefs", body: "Every brief shows the fee upfront. Apply in two taps." },
              { n: "03", title: "Deliver the work", body: "Submit through the platform, request revisions if needed, no extra charge." },
              { n: "04", title: "Get paid", body: "Released the moment it's approved, or automatically after 7 days." },
            ].map((step) => (
              <div key={step.n} className="bg-white p-7">
                <p className="font-display text-sm font-extrabold text-[#16255c]">{step.n}</p>
                <h3 className="mt-3 font-display text-lg font-extrabold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5b6472]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How you get discovered */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">How you get discovered</h2>
        <p className="mt-3 max-w-xl text-[#5b6472]">
          No admin team decides who&apos;s good enough. This is how creators actually build a reputation on RealReach.
        </p>

        <div className="mt-10 grid gap-2 sm:grid-cols-4">
          {PATH_STEPS.map((step, index) => (
            <button
              key={step.tabLabel}
              onClick={() => setActiveStep(index)}
              className={`border p-5 text-left transition-colors ${
                activeStep === index
                  ? "border-[#0d1117] bg-[#0d1117] text-[#f1f3f7]"
                  : "border-[#0d1117]/20 bg-white text-[#0d1117] hover:border-[#0d1117]"
              }`}
            >
              <span className={activeStep === index ? "text-[#c8f23c]" : "text-[#16255c]"}>{step.icon}</span>
              <p className="mt-3 font-display text-sm font-extrabold">{step.tabLabel}</p>
            </button>
          ))}
        </div>

        <div className="mt-2 rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8 sm:p-10">
          <h3 className="font-display text-2xl font-extrabold">{PATH_STEPS[activeStep].title}</h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5b6472]">{PATH_STEPS[activeStep].body}</p>
        </div>
      </section>

      {/* Academy teaser */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-10 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#16255c]">Creator Academy</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Once you&apos;ve done a few jobs, teach what worked.</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#5b6472]">
              Publish a paid lesson for other creators — pitching, pricing, content strategy. Same payout account you already have.
            </p>
          </div>
          <Link
            href="/academy"
            className="mt-6 inline-flex shrink-0 items-center justify-center rounded-[8px] bg-[#16255c] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:mt-0"
          >
            Visit the Academy
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">
        <h2 className="font-display text-3xl font-extrabold">Common questions from creators</h2>
        <div className="mt-8 divide-y divide-[#0d1117]/[0.07] border-y border-[#0d1117]/[0.07]">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-7">
              <p className="font-bold text-[#0d1117]">{faq.q}</p>
              <p className="mt-2 text-sm leading-6 text-[#5b6472]">{faq.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm">
          <Link href="/help" className="font-bold text-[#16255c] hover:underline">
            See the full Help Center →
          </Link>
        </p>
      </section>

      {/* CTA */}
      <section className="bg-[#0d1117] py-24 text-[#f1f3f7]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Join free, no follower minimum.</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#8891a3]">
            Build a profile and start applying to briefs that show the fee upfront.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-block rounded-[8px] bg-[#16255c] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Sign up as a creator
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#0d1117]/10 bg-[#0d1117] px-5 py-12 text-[#8891a3]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f1f3f7]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/campaigns" className="hover:text-[#f1f3f7]">Browse Campaigns</Link>
            <Link href="/academy" className="hover:text-[#f1f3f7]">Academy</Link>
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
