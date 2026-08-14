"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { supabase } from "@/lib/supabase"

const VALUE_PROPS = [
  {
    title: "No subscription",
    body: "Browse, post a brief, and message creators for free. We only take a fee on jobs that actually get paid out — no monthly cost to access the platform at all.",
  },
  {
    title: "Escrow, not trust",
    body: "Payment is held the moment you hire, released when you approve. Neither side can walk away with the other's money.",
  },
  {
    title: "Real numbers, not a pitch",
    body: "Every creator profile shows real follower counts and real reviews from past jobs — no minimum follower gate hiding good creators with smaller, more engaged audiences.",
  },
  {
    title: "Disputes that actually freeze money",
    body: "If something goes wrong, either side can raise a dispute. It locks the payment immediately — nothing releases until it's resolved.",
  },
]

const FAQS = [
  {
    q: "How much does it cost?",
    a: "Nothing to browse or post a brief. We take a platform fee only on jobs that complete successfully — see the full breakdown on our pricing page.",
  },
  {
    q: "What if the content isn't what I asked for?",
    a: "Request revisions — as many as you need, at no extra charge — before approving. If you can't reach agreement, raise a dispute and the payment freezes until it's sorted.",
  },
  {
    q: "Can I hire the same creator again?",
    a: "Yes — message them directly, or post a new brief and invite them. There's no exclusivity lock-in on either side.",
  },
]

export default function ForBrandsPage() {
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
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c8f23c]">For Brands</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            Hire UK creators without the agency markup.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#a8adb6]">
            Post a brief with a real fee attached, get matched with micro-influencers who actually reply, and pay only when the work&apos;s approved. No subscription, no discovery calls.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Post your first brief
            </Link>
            <Link
              href="/creators"
              className="border-2 border-[#f5f3ee]/40 px-6 py-3 text-sm font-bold text-[#f5f3ee] transition-colors hover:border-[#f5f3ee]"
            >
              Browse creators first
            </Link>
          </div>
          <div className="mx-auto mt-14 grid max-w-lg grid-cols-2 gap-6 border-t border-[#f5f3ee]/15 pt-8">
            <div>
              <p className="font-display text-3xl font-extrabold">{creatorCount ?? "—"}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#a8adb6]">UK creators</p>
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold">{openJobCount ?? "—"}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#a8adb6]">Live briefs right now</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Why brands use RealReach</h2>
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
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Four steps, no middlemen</h2>
            <Link href="/how-it-works" className="text-sm font-bold text-[#1a54f0] hover:underline">
              See the full process →
            </Link>
          </div>
          <div className="mt-10 grid gap-px border border-[#10141b]/10 bg-[#10141b]/10 md:grid-cols-4">
            {[
              { n: "01", title: "Post a brief", body: "Structured fields, a fixed fee, an optional AI draft if you're stuck." },
              { n: "02", title: "Get matched", body: "Creators apply, or you invite one directly. No discovery calls." },
              { n: "03", title: "Pay into escrow", body: "Funds lock the moment you hire, not after delivery." },
              { n: "04", title: "Approve & release", body: "Unlimited revisions, one click to pay once you're happy." },
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

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">
        <h2 className="font-display text-3xl font-extrabold">Common questions from brands</h2>
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
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Post your first brief, free.</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#a8adb6]">
            No subscription to sign up for. See who&apos;s actually out there before you commit to anything.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-block border-2 border-[#10141b] bg-[#1a54f0] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Sign up as a brand
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
            <Link href="/creators" className="hover:text-[#f5f3ee]">Browse Creators</Link>
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
