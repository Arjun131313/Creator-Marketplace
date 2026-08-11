"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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

type OpenJob = {
  id: string
  title: string
  budget: number
  brand_name: string
}

function getStartingPrice(packages: CreatorPackage[] | null): number | null {
  if (!packages?.length) return null
  const prices = packages.map((p) => p.price).filter((p): p is number => typeof p === "number" && p > 0)
  if (!prices.length) return null
  return Math.min(...prices)
}

function creatorInitials(name: string | null): string {
  if (!name) return "C"
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

export default function Home() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [creatorCount, setCreatorCount] = useState<number | null>(null)
  const [openJobs, setOpenJobs] = useState<OpenJob[]>([])
  const [openJobCount, setOpenJobCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [profilesRes, countRes, jobsRes, jobsCountRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id,display_name,niche,avatar_url,platform_stats,packages")
            .eq("role", "creator")
            .limit(50),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "creator"),
          supabase
            .from("jobs")
            .select("id,title,budget,brand_id")
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(3),
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
        ])

        if (!mounted) return

        const rawProfiles = (profilesRes.data ?? []) as Array<{
          id: string
          display_name: string | null
          niche: string | null
          avatar_url: string | null
          platform_stats: unknown
          packages: unknown
        }>

        const { data: reviews } = await supabase
          .from("reviews")
          .select("creator_id,rating")
          .in("creator_id", rawProfiles.length ? rawProfiles.map((p) => p.id) : ["00000000-0000-0000-0000-000000000000"])

        const statsById = new Map<string, { count: number; total: number }>()
        ;(reviews ?? []).forEach((r) => {
          const s = statsById.get(r.creator_id) ?? { count: 0, total: 0 }
          statsById.set(r.creator_id, { count: s.count + 1, total: s.total + r.rating })
        })

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
          .slice(0, 4)

        if (mounted) setCreators(result)
        if (mounted) setCreatorCount(countRes.count ?? 0)
        if (mounted) setOpenJobCount(jobsCountRes.count ?? 0)

        const rawJobs = (jobsRes.data ?? []) as Array<{ id: string; title: string; budget: number; brand_id: string }>
        if (rawJobs.length) {
          const { data: brandProfiles } = await supabase
            .from("profiles")
            .select("id,display_name")
            .in("id", rawJobs.map((j) => j.brand_id))
          const nameById = new Map((brandProfiles ?? []).map((p) => [p.id, p.display_name ?? "A brand"]))
          if (mounted) {
            setOpenJobs(rawJobs.map((j) => ({ id: j.id, title: j.title, budget: j.budget, brand_name: nameById.get(j.brand_id) ?? "A brand" })))
          }
        }
      } catch (err) {
        console.error("Failed to load homepage data:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const heroCreator = creators[0]
  const heroPrice = heroCreator ? getStartingPrice(heroCreator.packages) : null

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      {/* ── STAT BAR ──────────────────────────────────────────────────────── */}
      <div className="border-b border-[#10141b]/10 bg-[#f5f3ee] px-5 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-[#595e66]">
        {creatorCount !== null ? `${creatorCount} UK creators` : "Loading"}
        {" · "}
        {openJobCount !== null && openJobCount > 0 ? `${openJobCount} live briefs` : "founding cohort now open"}
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="font-display text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Small
              <br />
              audience.
              <br />
              <span className="text-[#1a54f0]">Serious money.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#595e66] sm:text-lg">
              RealReach Agency pairs UK brands with micro-influencers who actually get replies. Fixed fees in pounds, paid on delivery, no agency taking a third.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="bg-[#1a54f0] px-6 py-3.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                I&apos;m a creator →
              </Link>
              <Link
                href="/signup"
                className="border border-[#10141b] px-6 py-3.5 text-center text-sm font-bold text-[#10141b] transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee]"
              >
                I&apos;m a brand →
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 border-t border-[#10141b]/10 pt-8">
              <div>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">100%</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Escrow protected</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">£0</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Subscription fees</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">UK</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Built for UK brands</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#10141b]">
              {loading ? (
                <div className="h-full w-full animate-pulse bg-[#1b2028]" />
              ) : heroCreator ? (
                <Link href={`/creators/${heroCreator.id}`} className="block h-full w-full">
                  {heroCreator.avatar_url ? (
                    <img
                      src={heroCreator.avatar_url}
                      alt={heroCreator.display_name ?? ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src="/images/hero-vlogger.jpg"
                      alt="A creator filming content"
                      className="h-full w-full object-cover"
                    />
                  )}
                </Link>
              ) : (
                <img src="/images/hero-vlogger.jpg" alt="A creator filming content" className="h-full w-full object-cover" />
              )}
            </div>
            {heroPrice && heroCreator && (
              <div className="absolute -bottom-5 -left-5 border border-[#10141b] bg-[#f5f3ee] px-5 py-4 shadow-[6px_6px_0_#10141b]">
                <p className="font-display text-2xl font-extrabold">£{heroPrice.toLocaleString()}</p>
                <p className="text-xs text-[#595e66]">per reel · {(heroCreator.display_name ?? "Creator").split(" ")[0]}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── NICHE TICKER ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-[#10141b]/10 bg-[#10141b] py-3">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-10">
          {[...NICHE_CATEGORIES, ...NICHE_CATEGORIES].map((cat, i) => (
            <span key={i} className="shrink-0 text-sm font-bold uppercase tracking-wide text-[#a8adb6]">
              {cat.name}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>

      {/* ── HOW IT RUNS ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">How it runs</h2>
        <div className="mt-10 grid gap-px border border-[#10141b]/10 bg-[#10141b]/10 md:grid-cols-3">
          {[
            { n: "01", title: "Brief or profile", body: "Brands post a brief with a fixed fee. Creators build a profile that reads like a portfolio, not a form." },
            { n: "02", title: "Match & message", body: "Apply in two taps, or invite a creator directly. Everything happens in one DM thread." },
            { n: "03", title: "Deliver & get paid", body: "Funds are held on acceptance and released the day content goes live." },
          ].map((step) => (
            <div key={step.n} className="bg-[#f5f3ee] p-7">
              <p className="font-display text-sm font-extrabold text-[#1a54f0]">{step.n}</p>
              <h3 className="mt-3 font-display text-xl font-extrabold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#595e66]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CREATORS ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Meet the creators</h2>
          <Link href="/creators" className="text-sm font-bold text-[#1a54f0] hover:underline">
            All creators →
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-px border border-[#10141b]/10 bg-[#10141b]/10 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 animate-pulse bg-[#f5f3ee]" />)}
          </div>
        ) : creators.length === 0 ? (
          <div className="border border-[#10141b]/10 bg-white p-16 text-center">
            <p className="text-[#595e66]">No creators yet. Be the first to join.</p>
            <Link href="/signup" className="mt-4 inline-block bg-[#1a54f0] px-5 py-2.5 text-sm font-bold text-white">Join as a creator</Link>
          </div>
        ) : (
          <div className="grid gap-px border border-[#10141b]/10 bg-[#10141b]/10 sm:grid-cols-2 lg:grid-cols-4">
            {creators.map((creator) => {
              const price = getStartingPrice(creator.packages)
              const tier = getCreatorTier(creator.reviewCount, creator.avgRating)
              const igFollowers = getPlatformFollowers(creator.platform_stats, "instagram")
              return (
                <Link key={creator.id} href={`/creators/${creator.id}`} className="group block bg-white">
                  <div className="relative aspect-square overflow-hidden bg-[#eae8e1]">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.display_name ?? ""} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-3xl font-extrabold text-[#595e66]">
                        {creatorInitials(creator.display_name)}
                      </div>
                    )}
                    {creator.avgRating !== null && (
                      <span className="absolute left-2 top-2 bg-[#c8f23c] px-2 py-1 text-[10px] font-bold text-[#10141b]">
                        {creator.avgRating.toFixed(1)} ★
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-display text-base font-extrabold">{creator.display_name ?? "Creator"}</p>
                    <p className="mt-0.5 truncate text-xs text-[#595e66]">
                      {creator.niche ?? "Content creator"}{igFollowers ? ` · ${(igFollowers / 1000).toFixed(0)}k followers` : ""}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${tier.className}`}>{tier.label}</span>
                      {price && <span className="font-display text-sm font-extrabold text-[#1a54f0]">from £{price}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── LIVE BRIEFS ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Live briefs, right now</h2>
          <Link href="/signup" className="text-sm font-bold text-[#1a54f0] hover:underline">
            Browse all briefs →
          </Link>
        </div>
        <p className="mb-8 max-w-xl text-sm text-[#595e66]">
          Every brief lists the fee before you apply. No &quot;exposure&quot;, no gifting-only, no discovery calls.
        </p>
        {openJobs.length === 0 ? (
          <div className="border border-[#10141b]/10 bg-white p-12 text-center">
            <p className="text-[#595e66]">No open briefs yet — we&apos;re onboarding our founding brands. Post the first one.</p>
            <Link href="/signup" className="mt-4 inline-block bg-[#1a54f0] px-5 py-2.5 text-sm font-bold text-white">Post a brief</Link>
          </div>
        ) : (
          <div className="grid gap-px border border-[#10141b]/10 bg-[#10141b]/10 md:grid-cols-3">
            {openJobs.map((job) => (
              <div key={job.id} className="bg-white p-6">
                <p className="font-display text-lg font-extrabold">{job.title}</p>
                <p className="mt-1 text-xs text-[#595e66]">{job.brand_name}</p>
                <p className="mt-4 font-display text-xl font-extrabold text-[#1a54f0]">£{job.budget.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
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
