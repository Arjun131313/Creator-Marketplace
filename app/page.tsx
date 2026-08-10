"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { supabase } from "@/lib/supabase"
import { getPlatformFollowers } from "@/types/database"
import type { PlatformStats, CreatorPackage } from "@/types/database"
import { getCreatorTier } from "@/lib/creator-tier"
import { NICHE_CATEGORIES } from "@/lib/niches"

type Creator = {
  id: string
  display_name: string | null
  niche: string | null
  avatar_url: string | null
  platform_stats: PlatformStats | null
  packages: CreatorPackage[] | null
  reviewCount: number
  avgRating: number | null
}

const CATEGORIES = [
  "Instagram",
  "TikTok",
  "Snapchat",
  "UGC",
  "Photography",
  "Video Production",
]

const STEPS = [
  {
    n: "01",
    title: "Post a brief",
    body: "Share your campaign goals, target audience, and creative requirements. Takes less than 5 minutes.",
  },
  {
    n: "02",
    title: "Browse & shortlist",
    body: "Explore verified creator profiles filtered by platform, niche, follower count, and starting price.",
  },
  {
    n: "03",
    title: "Book & launch",
    body: "Send an offer, manage deliverables, and pay securely — all in one place, no back-and-forth emails.",
  },
]

const STATS = [
  { value: "£0", label: "Cost to browse & message" },
  { value: "100%", label: "Payments held in escrow" },
  { value: "0%", label: "Subscription fees" },
  { value: "UK", label: "Built for UK brands" },
]

const WHY_BRANDS_JOIN = [
  {
    title: "Escrow-protected payments",
    body: "Funds sit with our payment processor until you approve the delivered content — never pay upfront on trust alone.",
  },
  {
    title: "Vetted before they're listed",
    body: "Every microinfluencer profile is reviewed for authenticity and audience quality before it goes live on the platform.",
  },
  {
    title: "No subscriptions, ever",
    body: "Browsing, messaging, and posting a brief costs nothing. We only take a fee when a job is successfully completed.",
  },
]

const PRICING_POINTS = [
  {
    n: "01",
    title: "Free to browse & message",
    body: "Searching creators, messaging, and posting a brief costs nothing — no subscription, no seat fees.",
  },
  {
    n: "02",
    title: "Creators set their own rates",
    body: "Every creator publishes Basic, Standard, and Premium packages — or negotiate a custom rate directly in the app.",
  },
  {
    n: "03",
    title: "Pay only on completed work",
    body: "Funds sit in escrow until you approve the content. A platform fee applies only when a job is successfully completed.",
  },
]

const FAQ_PREVIEW = [
  {
    q: "Is RealReach Agency free to use?",
    a: "Browsing and messaging creators is free. A platform fee applies only when a job is successfully completed. No monthly subscription needed.",
  },
  {
    q: "How does pricing work for creators?",
    a: "Creators set their own packages starting from Basic, Standard, and Premium tiers. You can also negotiate custom rates directly in the app.",
  },
  {
    q: "What if I'm not happy with the content?",
    a: "You can request revisions before approving. If a dispute arises, our support team steps in. Payment is never released until you're satisfied.",
  },
  {
    q: "How long does it take to find a creator?",
    a: "Most brands receive their first applications within 24–48 hours of posting a job. You can also browse and reach out to creators directly.",
  },
]

function getActivePlatforms(stats: PlatformStats | null): string[] {
  if (!stats) return []
  const r: string[] = []
  if (getPlatformFollowers(stats, "instagram")) r.push("Instagram")
  if (getPlatformFollowers(stats, "tiktok")) r.push("TikTok")
  if (getPlatformFollowers(stats, "snapchat")) r.push("Snapchat")
  return r
}

function getStartingPrice(packages: CreatorPackage[] | null): string | null {
  if (!packages?.length) return null
  const prices = packages
    .map((p) => p.price)
    .filter((p): p is number => typeof p === "number" && p > 0)
  if (!prices.length) return null
  return `£${Math.min(...prices).toLocaleString()}`
}

function creatorInitials(name: string | null): string {
  if (!name) return "C"
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Home() {
  const router = useRouter()
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [heroSearch, setHeroSearch] = useState("")
  const [creatorCount, setCreatorCount] = useState<number | null>(null)

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault()
    const term = heroSearch.trim()
    router.push(term ? `/creators?search=${encodeURIComponent(term)}` : "/creators")
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [{ data: profiles, error: profilesError }, { count }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id,display_name,niche,avatar_url,platform_stats,packages")
            .eq("role", "creator")
            .limit(50),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "creator"),
        ])

        if (profilesError) throw profilesError
        if (mounted) setCreatorCount(count ?? 0)

        const rawProfiles = (profiles ?? []) as Array<{
          id: string
          display_name: string | null
          niche: string | null
          avatar_url: string | null
          platform_stats: unknown
          packages: unknown
        }>

        if (rawProfiles.length === 0) {
          if (mounted) setCreators([])
          return
        }

        const { data: reviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("creator_id,rating")
          .in("creator_id", rawProfiles.map((p) => p.id))

        if (reviewsError) throw reviewsError

        const rawReviews = (reviews ?? []) as Array<{ creator_id: string; rating: number }>

        const statsById = new Map<string, { count: number; total: number }>()
        for (const r of rawReviews) {
          const s = statsById.get(r.creator_id) ?? { count: 0, total: 0 }
          statsById.set(r.creator_id, { count: s.count + 1, total: s.total + r.rating })
        }

        const result: Creator[] = rawProfiles
          .map((p) => {
            const s = statsById.get(p.id)
            return {
              id: p.id,
              display_name: p.display_name,
              niche: p.niche,
              avatar_url: p.avatar_url,
              platform_stats: p.platform_stats as PlatformStats | null,
              packages: p.packages as CreatorPackage[] | null,
              reviewCount: s?.count ?? 0,
              avgRating: s ? s.total / s.count : null,
            }
          })
          .sort((a, b) => b.reviewCount - a.reviewCount)
          .slice(0, 6)

        if (mounted) setCreators(result)
      } catch (err) {
        console.error("Failed to load creators:", err)
        if (mounted) setLoadError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const heroCreator = creators[0]
  const listCreators = creators.slice(1, 6)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f1e8] text-[#18140f]">
      <PublicNav />

      {/* ── HERO (ink) ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#18140f] text-[#f5f1e8]">
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-8 lg:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">

            {/* Left: text */}
            <div className="space-y-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e8a37c]">
                For brands who&apos;d rather work with people than platforms
              </p>

              <h1 className="font-serif text-5xl font-medium leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.5rem]">
                Hire creators your customers{" "}
                <em className="text-accent-serif not-italic">
                  <span className="italic">already follow.</span>
                </em>
              </h1>

              <p className="max-w-lg text-lg leading-8 text-[#b8afa0]">
                RealReach Agency connects brands with everyday microinfluencers on Instagram, TikTok, and Snapchat — real people your customers already follow. No subscriptions, no agency retainers, no guesswork.
              </p>

              {/* Search */}
              <form
                onSubmit={handleHeroSearch}
                className="rounded-sm border border-[#3a332a] bg-[#f5f1e8] p-1.5"
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="w-full bg-transparent px-4 py-3.5 text-sm text-[#18140f] placeholder:text-[#6b6153] focus:outline-none"
                    placeholder="e.g. TikTok fitness, product photography, UGC…"
                    type="search"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 rounded-[2px] bg-[#c1440e] px-6 py-3.5 text-center text-sm font-semibold text-[#fef8f2] transition-colors hover:bg-[#a23a0c]"
                  >
                    Browse creators
                  </button>
                </div>
              </form>

              {/* Category chips */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={`/creators?niche=${encodeURIComponent(cat)}`}
                    className="rounded-full border border-[#3a332a] px-4 py-1.5 text-sm text-[#b8afa0] transition-colors hover:border-[#e8a37c] hover:text-[#e8a37c]"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: asymmetric creator spotlight collage */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2a241d]">
                {loading ? (
                  <div className="h-full w-full animate-pulse bg-[#332c22]" />
                ) : heroCreator ? (
                  <Link href={`/creators/${heroCreator.id}`} className="group block h-full w-full">
                    {heroCreator.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroCreator.avatar_url}
                        alt={heroCreator.display_name ?? ""}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#2a241d] font-serif text-6xl text-[#e8a37c]">
                        {creatorInitials(heroCreator.display_name)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b08] via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {heroCreator.niche && (
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#e8a37c]">
                          {heroCreator.niche}
                        </p>
                      )}
                      <p className="font-serif text-2xl">{heroCreator.display_name ?? "Creator"}</p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-[#6b6153]">
                    No creators yet
                  </div>
                )}
              </div>

              {/* Floating stat card, breaking the frame */}
              <div className="paper-card absolute -left-8 -top-8 rotate-[-3deg] p-5 shadow-xl">
                <p className="font-serif text-3xl text-[#18140f]">{creatorCount !== null ? creatorCount : "–"}</p>
                <p className="text-xs text-[#6b6153]">Creators on the platform</p>
              </div>
              <div className="paper-card absolute -bottom-6 -right-6 rotate-[2deg] p-4 shadow-xl">
                <p className="flex items-center gap-1 text-sm font-semibold text-[#18140f]">
                  <span className="text-[#c1440e]">●</span> Escrow protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRENDING NICHES (paper, photo tiles) ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#c1440e]">Trending niches</p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {NICHE_CATEGORIES.filter((cat) => cat.image).map((cat) => (
            <Link
              key={cat.name}
              href={`/creators?niche=${encodeURIComponent(cat.name)}`}
              className="group relative aspect-[3/4] w-40 shrink-0 overflow-hidden bg-[#18140f]/5 sm:w-48"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image!}
                alt={`${cat.name} creators`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b08]/80 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-3 font-serif text-lg text-[#f5f1e8]">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRUST BAR (paper) ────────────────────────────────────────────── */}
      <div className="border-b border-[#18140f]/10 py-10">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#6b6153]">
            Newly launched — now onboarding founding brands across the UK
          </p>
        </div>
      </div>

      {/* ── TOP CREATORS (paper, editorial featured + list) ────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-28 md:px-8">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c1440e]">Top creators</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Discover the <em className="not-italic italic">best talent</em>
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#6b6153]">
            Hand-picked creators with proven track records across all major platforms.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
            <div className="aspect-[4/5] animate-pulse bg-[#18140f]/5 lg:col-span-2" />
            <div className="space-y-4 lg:col-span-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse bg-[#18140f]/5" />
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div className="paper-card p-16 text-center">
            <p className="text-[#6b6153]">Couldn&apos;t load creators right now. Please try again in a moment.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-block rounded-[2px] bg-[#c1440e] px-6 py-3 text-sm font-semibold text-[#fef8f2] transition-colors hover:bg-[#a23a0c]"
            >
              Retry
            </button>
          </div>
        ) : creators.length === 0 ? (
          <div className="paper-card p-16 text-center">
            <p className="text-[#6b6153]">No creators yet. Be the first to join.</p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-[2px] bg-[#c1440e] px-6 py-3 text-sm font-semibold text-[#fef8f2] transition-colors hover:bg-[#a23a0c]"
            >
              Join as a creator
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
              <div className="lg:col-span-2">
                <FeaturedCreatorCard creator={creators[0]} />
              </div>
              <div className="divide-y divide-[#18140f]/10 border-y border-[#18140f]/10 lg:col-span-3">
                {listCreators.map((c) => (
                  <CreatorListRow key={c.id} creator={c} />
                ))}
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/creators"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-[#18140f]"
              >
                Browse all creators
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── HOW IT WORKS (ink, timeline) ─────────────────────────────────── */}
      <section className="bg-[#18140f] py-28 text-[#f5f1e8]">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mb-16 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#e8a37c]">How it works</p>
            <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              Launch in <em className="not-italic italic">three steps</em>
            </h2>
          </div>

          <div className="grid gap-10 border-t border-[#3a332a] md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="border-t-2 border-[#c1440e] pt-8 -mt-px">
                <p className="font-serif text-5xl text-[#3a332a]">{step.n}</p>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-7 text-[#b8afa0]">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <Link
              href="/how-it-works"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#e8a37c]"
            >
              Learn more about the process
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS (solid accent band) ────────────────────────────────────── */}
      <section className="bg-[#c1440e] py-20 text-[#fef8f2]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-[#fef8f2]/20 px-6 md:px-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-4 text-center first:pl-0 lg:px-8">
              <p className="font-serif text-4xl lg:text-5xl">{stat.value}</p>
              <p className="mt-2 text-sm text-[#fde3d0]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY BRANDS JOIN (paper) ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-28 md:px-8">
        <div className="mb-16 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c1440e]">Now onboarding</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Why brands are <em className="not-italic italic">joining early</em>
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#6b6153]">
            We&apos;re a newly launched platform building our founding cohort of brands and microinfluencers — here&apos;s what you get from day one.
          </p>
        </div>

        <div className="grid gap-10 border-t border-[#18140f]/10 pt-10 md:grid-cols-3">
          {WHY_BRANDS_JOIN.map((item) => (
            <div key={item.title}>
              <h3 className="font-serif text-xl text-[#18140f]">{item.title}</h3>
              <p className="mt-3 leading-7 text-[#6b6153]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING (ink, spec-sheet rows) ───────────────────────────────── */}
      <section className="bg-[#18140f] py-28 text-[#f5f1e8]">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mb-16 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#e8a37c]">Pricing</p>
            <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              Simple, <em className="not-italic italic">transparent pricing</em>
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#b8afa0]">
              No subscriptions, no seat fees. Pay creators directly — we only charge when a job is done.
            </p>
          </div>

          <div className="divide-y divide-[#3a332a] border-y border-[#3a332a]">
            {PRICING_POINTS.map((p) => (
              <div key={p.n} className="grid gap-2 py-8 md:grid-cols-[80px_1fr_2fr] md:items-baseline">
                <span className="font-serif text-lg text-[#e8a37c]">{p.n}</span>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="leading-7 text-[#b8afa0]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ PREVIEW (paper) ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-28 md:px-8">
        <div className="mb-16 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c1440e]">FAQ</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Common <em className="not-italic italic">questions</em>
          </h2>
        </div>
        <div className="divide-y divide-[#18140f]/10 border-y border-[#18140f]/10">
          {FAQ_PREVIEW.map((f) => (
            <div key={f.q} className="py-7">
              <p className="font-semibold text-[#18140f]">{f.q}</p>
              <p className="mt-2 leading-7 text-[#6b6153]">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/how-it-works"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#18140f]"
          >
            See all FAQs
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── CTA (ink) ─────────────────────────────────────────────────────── */}
      <section className="bg-[#18140f] py-28 text-[#f5f1e8]">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Ready to find your <em className="not-italic italic">perfect creator?</em>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg text-[#b8afa0]">
            Join brands who trust RealReach Agency to run their microinfluencer campaigns — from brief to results.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-[2px] bg-[#c1440e] px-8 py-4 text-sm font-semibold text-[#fef8f2] transition-colors hover:bg-[#a23a0c]"
            >
              Start for free
            </Link>
            <Link
              href="/creators"
              className="rounded-[2px] border border-[#3a332a] px-8 py-4 text-sm font-semibold text-[#f5f1e8] transition-colors hover:border-[#e8a37c]"
            >
              Browse creators
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#3a332a] bg-[#18140f] px-6 py-16 text-[#8b8578]">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <span className="font-serif text-lg text-[#f5f1e8]">
              Real<em className="not-italic italic text-[#e8a37c]">Reach</em>
            </span>
            <p className="max-w-xs text-sm leading-6">
              Connecting everyday microinfluencers with brands for authentic partnerships and measurable campaign results.
            </p>
            <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="mb-5 text-sm font-semibold text-[#f5f1e8]">Platform</p>
              <ul className="space-y-3 text-sm">
                <li><Link href="/creators" className="transition hover:text-[#f5f1e8]">Browse Creators</Link></li>
                <li><Link href="/how-it-works" className="transition hover:text-[#f5f1e8]">How it Works</Link></li>
                <li><Link href="/signup" className="transition hover:text-[#f5f1e8]">Sign Up</Link></li>
                <li><Link href="/waitlist" className="transition hover:text-[#f5f1e8]">Creator Waitlist</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-5 text-sm font-semibold text-[#f5f1e8]">Support</p>
              <ul className="space-y-3 text-sm">
                <li><Link href="/help" className="transition hover:text-[#f5f1e8]">Help Center</Link></li>
                <li><Link href="/terms" className="transition hover:text-[#f5f1e8]">Terms</Link></li>
                <li><Link href="/privacy" className="transition hover:text-[#f5f1e8]">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-5 text-sm font-semibold text-[#f5f1e8]">Contact</p>
              <ul className="space-y-3 text-sm">
                <li>hello@realreachagency.com</li>
                <li>+44 20 7946 0958</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}

// ── Featured creator card (editorial poster style) ──────────────────────────
function FeaturedCreatorCard({ creator }: { creator: Creator }) {
  const price = getStartingPrice(creator.packages)
  const rating = creator.avgRating
  const tier = getCreatorTier(creator.reviewCount, creator.avgRating)

  return (
    <Link href={`/creators/${creator.id}`} className="group relative block aspect-[4/5] overflow-hidden bg-[#18140f]">
      {creator.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={creator.avatar_url}
          alt={creator.display_name ?? ""}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center font-serif text-6xl text-[#e8a37c]">
          {creatorInitials(creator.display_name)}
        </div>
      )}
      <div className="absolute left-4 top-4">
        <span className="rounded-full bg-[#0d0b08]/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#fef8f2] backdrop-blur-md">
          {tier.label}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b08] via-[#0d0b08]/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-7 text-[#f5f1e8]">
        {creator.niche && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e8a37c]">
            {creator.niche}
          </p>
        )}
        <h3 className="font-serif text-3xl">{creator.display_name ?? "Creator"}</h3>
        <div className="mt-3 flex items-center gap-4 text-sm">
          {rating !== null && (
            <span className="flex items-center gap-1.5">
              <span className="text-[#e8a37c]">★</span>
              {rating.toFixed(1)}
            </span>
          )}
          {price && <span className="font-semibold text-[#e8a37c]">From {price}</span>}
        </div>
      </div>
    </Link>
  )
}

// ── Creator list row (editorial directory style) ─────────────────────────────
function CreatorListRow({ creator }: { creator: Creator }) {
  const price = getStartingPrice(creator.packages)
  const rating = creator.avgRating
  const platforms = getActivePlatforms(creator.platform_stats)
  const tier = getCreatorTier(creator.reviewCount, creator.avgRating)

  return (
    <Link
      href={`/creators/${creator.id}`}
      className="group flex items-center gap-4 py-5 transition-colors hover:bg-[#18140f]/[0.03]"
    >
      {creator.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={creator.avatar_url}
          alt={creator.display_name ?? ""}
          className="h-14 w-14 flex-shrink-0 object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center bg-[#e9e1d0] font-serif text-lg text-[#18140f]">
          {creatorInitials(creator.display_name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-[#18140f]">{creator.display_name ?? "Creator"}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${tier.className}`}>
            {tier.label}
          </span>
        </div>
        <p className="truncate text-sm text-[#6b6153]">
          {creator.niche ?? "Content Creator"}{platforms.length > 0 ? ` · ${platforms.join(", ")}` : ""}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-4 text-sm">
        {rating !== null ? (
          <span className="hidden items-center gap-1 text-[#18140f] sm:flex">
            <span className="text-[#c1440e]">★</span>
            {rating.toFixed(1)}
          </span>
        ) : null}
        {price && <span className="font-semibold text-[#c1440e]">From {price}</span>}
        <ArrowIcon className="h-4 w-4 text-[#6b6153] transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
