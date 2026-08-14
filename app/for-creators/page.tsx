"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { supabase } from "@/lib/supabase"

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
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      {/* Hero */}
      <section className="bg-[#10141b] py-24 text-[#f5f3ee]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c8f23c]">For Creators</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            Small audience. Serious money.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#a8adb6]">
            Every brief shows the fee before you apply. No follower minimum, no exposure-only offers, paid automatically once your work&apos;s approved.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Join free
            </Link>
            <Link
              href="/campaigns"
              className="border-2 border-[#f5f3ee]/40 px-6 py-3 text-sm font-bold text-[#f5f3ee] transition-colors hover:border-[#f5f3ee]"
            >
              Browse open briefs first
            </Link>
          </div>
          <div className="mx-auto mt-14 grid max-w-lg grid-cols-2 gap-6 border-t border-[#f5f3ee]/15 pt-8">
            <div>
              <p className="font-display text-3xl font-extrabold">{creatorCount ?? "—"}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#a8adb6]">Creators already on RealReach</p>
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold">{openJobCount ?? "—"}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#a8adb6]">Open briefs right now</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Why creators use RealReach</h2>
        <div className="mt-10 grid gap-px border border-[#10141b]/10 bg-[#10141b]/10 sm:grid-cols-2">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="bg-[#f5f3ee] p-7">
              <h3 className="font-display text-xl font-extrabold">{v.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#595e66]">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process summary */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Four steps to your first job</h2>
            <Link href="/how-it-works" className="text-sm font-bold text-[#1a54f0] hover:underline">
              See the full process →
            </Link>
          </div>
          <div className="mt-10 grid gap-px border border-[#10141b]/10 bg-[#10141b]/10 md:grid-cols-4">
            {[
              { n: "01", title: "Build a profile", body: "Real follower counts, your niche, your portfolio. No minimum to join." },
              { n: "02", title: "Apply to briefs", body: "Every brief shows the fee upfront. Apply in two taps." },
              { n: "03", title: "Deliver the work", body: "Submit through the platform, request revisions if needed, no extra charge." },
              { n: "04", title: "Get paid", body: "Released the moment it's approved, or automatically after 7 days." },
            ].map((step) => (
              <div key={step.n} className="bg-white p-7">
                <p className="font-display text-sm font-extrabold text-[#1a54f0]">{step.n}</p>
                <h3 className="mt-3 font-display text-lg font-extrabold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#595e66]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academy teaser */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <div className="border-2 border-[#10141b] bg-white p-10 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1a54f0]">Creator Academy</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Once you&apos;ve done a few jobs, teach what worked.</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#595e66]">
              Publish a paid lesson for other creators — pitching, pricing, content strategy. Same payout account you already have.
            </p>
          </div>
          <Link
            href="/academy"
            className="mt-6 inline-flex shrink-0 items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:mt-0"
          >
            Visit the Academy
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">
        <h2 className="font-display text-3xl font-extrabold">Common questions from creators</h2>
        <div className="mt-8 divide-y-2 divide-[#10141b]/10 border-y-2 border-[#10141b]/10">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-7">
              <p className="font-bold text-[#10141b]">{faq.q}</p>
              <p className="mt-2 text-sm leading-6 text-[#595e66]">{faq.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm">
          <Link href="/help" className="font-bold text-[#1a54f0] hover:underline">
            See the full Help Center →
          </Link>
        </p>
      </section>

      {/* CTA */}
      <section className="bg-[#10141b] py-24 text-[#f5f3ee]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Join free, no follower minimum.</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#a8adb6]">
            Build a profile and start applying to briefs that show the fee upfront.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-block border-2 border-[#10141b] bg-[#1a54f0] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Sign up as a creator
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#10141b]/10 bg-[#10141b] px-5 py-12 text-[#a8adb6]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f5f3ee]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/campaigns" className="hover:text-[#f5f3ee]">Browse Campaigns</Link>
            <Link href="/academy" className="hover:text-[#f5f3ee]">Academy</Link>
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
