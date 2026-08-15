"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import EmptyState from "@/components/empty-state"
import Reveal from "@/components/reveal"
import { supabase } from "@/lib/supabase"
import { getPlatformFollowers } from "@/types/database"
import type { PlatformStats, CreatorPackage } from "@/types/database"
import { getCreatorTier } from "@/lib/creator-tier"
import { NICHE_CATEGORIES, getNicheImage } from "@/lib/niches"

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

const MIN_REVIEWS_FOR_RATING = 3

function getStartingPrice(packages: CreatorPackage[] | null): number | null {
  if (!packages?.length) return null
  const prices = packages.map((p) => p.price).filter((p): p is number => typeof p === "number" && p > 0)
  if (!prices.length) return null
  return Math.min(...prices)
}

export default function Home() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [creatorCount, setCreatorCount] = useState<number | null>(null)
  const [openJobs, setOpenJobs] = useState<OpenJob[]>([])
  const [openJobCount, setOpenJobCount] = useState<number | null>(null)
  const [platformRating, setPlatformRating] = useState<{ avg: number; count: number } | null>(null)
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

        if (reviews && reviews.length >= MIN_REVIEWS_FOR_RATING) {
          const total = reviews.reduce((sum, r) => sum + r.rating, 0)
          if (mounted) setPlatformRating({ avg: total / reviews.length, count: reviews.length })
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
      <section className="mx-auto max-w-[1400px] px-5 py-16 md:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[782fr_578fr]">
          <div>
            {platformRating ? (
              <div className="mb-4 inline-flex items-center gap-2 border-2 border-[#10141b] bg-[#c8f23c] px-3 py-1.5">
                <span className="font-display text-sm font-extrabold text-[#182704]">{platformRating.avg.toFixed(1)} ★</span>
                <span className="text-xs font-bold text-[#182704]/70">{platformRating.count} reviews from real brands</span>
              </div>
            ) : null}
            <h1 className="font-display text-[15vw] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-[80px] lg:text-[120px] lg:leading-[0.95]">
              Small
              <br />
              audience.
              <br />
              <span className="text-[#1a54f0]">Serious money.</span>
            </h1>
            <p className="mt-6 max-w-[512px] text-lg leading-7 text-[#595e66]">
              Stop chasing agencies and waiting on discovery calls. Post a brief with a real fee attached, get matched with UK micro-influencers who actually reply, and pay only when the work lands.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="border-2 border-[#10141b] bg-[#1a54f0] px-6 py-4 text-center text-xl text-white transition-opacity hover:opacity-90"
              >
                I&apos;m a creator →
              </Link>
              <Link
                href="/signup"
                className="border-2 border-[#10141b] bg-transparent px-6 py-4 text-center text-xl text-[#10141b] transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee]"
              >
                I&apos;m a brand →
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-6 border-t border-[#10141b]/10 pt-8 sm:grid-cols-4">
              <div>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">100%</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Escrow protected</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">£0</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">For creators to join</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">∞</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Revisions, no extra charge</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">UK</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Built for UK brands</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[574/670] w-full overflow-hidden bg-[#10141b]">
              {loading ? (
                <div className="h-full w-full animate-pulse bg-[#1b2028]" />
              ) : heroCreator?.avatar_url ? (
                <Link href={`/creators/${heroCreator.id}`} className="block h-full w-full">
                  <img
                    src={heroCreator.avatar_url}
                    alt={heroCreator.display_name ?? ""}
                    className="h-full w-full object-cover"
                  />
                </Link>
              ) : (
                <img src="/images/hero-lovable-reference.jpg" alt="A UK content creator filming with a phone gimbal" className="h-full w-full object-cover" />
              )}
            </div>
            {heroPrice && heroCreator && (
              <div className="absolute bottom-8 -left-4 border-2 border-[#10141b] bg-[#feb930] px-4 py-3 shadow-[6px_6px_0_#10141b]">
                <p className="font-display text-2xl font-extrabold text-[#10141b]">£{heroPrice.toLocaleString()}</p>
                <p className="text-xs text-[#10141b]/70">per reel · {(heroCreator.display_name ?? "Creator").split(" ")[0]}</p>
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
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { n: "01", title: "Post it or profile it", body: "Brands write a brief with a real fee attached — no vague budgets. Creators build a profile that shows their actual work, not a CV." },
            { n: "02", title: "Match, no middlemen", body: "Apply in two taps, or a brand invites you directly. No discovery calls, no agency in the middle taking a cut of the conversation." },
            { n: "03", title: "Escrow, then paid", body: "Funds are locked in the moment you're hired and released automatically once the work's approved — or on a fixed timer if nobody's around to click approve." },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 90} className="h-full">
              <div className="surface-card surface-card-hover h-full p-7">
                <p className="font-display text-sm font-extrabold text-[#1a54f0]">{step.n}</p>
                <h3 className="mt-3 font-display text-xl font-extrabold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#595e66]">{step.body}</p>
              </div>
            </Reveal>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="surface-card h-72 animate-pulse" />)}
          </div>
        ) : creators.length === 0 ? (
          <EmptyState
            title="The founding cohort is being built"
            body="We're onboarding the first UK creators by hand right now. Join early and your profile is one of the first a brand sees."
            action={{ label: "Join as a creator", href: "/signup" }}
            secondary={{ label: "Hiring instead? Post a brief →", href: "/brand/jobs/new" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {creators.map((creator, i) => {
              const price = getStartingPrice(creator.packages)
              const tier = getCreatorTier(creator.reviewCount, creator.avgRating)
              const igFollowers = getPlatformFollowers(creator.platform_stats, "instagram")
              return (
                <Reveal key={creator.id} delay={Math.min(i, 4) * 70} className="h-full">
                <Link href={`/creators/${creator.id}`} className="surface-card surface-card-hover group block h-full overflow-hidden">
                  <div className="relative aspect-square overflow-hidden bg-[#eae8e1]">
                    <img
                      src={creator.avatar_url ?? getNicheImage(creator.niche)}
                      alt={creator.display_name ?? ""}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
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
                </Reveal>
              )
            })}
          </div>
        )}
      </section>

      {/* ── LIVE BRIEFS (full-bleed ink) ─────────────────────────────────── */}
      <section className="bg-[#10141b] py-16 text-[#f5f3ee]">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-5xl font-extrabold leading-none sm:text-6xl">
              Live briefs,
              <br />
              right now
            </h2>
            <p className="mt-6 max-w-md text-base leading-6 text-[#a8adb6]">
              Every brief shows the fee before you apply — not after a call, not after a DM. If it doesn&apos;t say the price, it&apos;s not on RealReach.
            </p>
            <Link href="/signup" className="mt-8 inline-block text-xs font-extrabold tracking-wide text-[#f5f3ee] underline decoration-2 underline-offset-4">
              BROWSE ALL{openJobCount !== null && openJobCount > 0 ? ` ${openJobCount}` : ""} BRIEFS
            </Link>
          </div>

          <div>
            {openJobs.length === 0 ? (
              <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[#f5f3ee]/15 bg-[#1b2028] px-6 py-12 text-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(26,84,240,0.18), transparent 70%)",
                  }}
                />
                <div className="relative">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border border-[#f5f3ee]/15 bg-[#10141b] text-[#c8f23c]">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="mt-5 font-display text-xl font-extrabold text-[#f5f3ee]">
                    Founding brands are being onboarded
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#a8adb6]">
                    The first briefs go live shortly. Get a profile up now so you&apos;re in the pool when they do.
                  </p>
                  <Link
                    href="/signup"
                    className="mt-6 inline-block rounded-[var(--radius-sm)] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                  >
                    Post a brief
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#f5f3ee]/12 border-t border-[#f5f3ee]/12">
                {openJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between gap-4 py-6">
                    <div className="min-w-0">
                      <span className="mb-2 inline-block bg-[#1a54f0] px-2 py-1 text-[10px] font-extrabold text-white">BRIEF</span>
                      <p className="truncate text-xl">{job.title}</p>
                      <p className="mt-1 text-sm text-[#a8adb6]">{job.brand_name}</p>
                    </div>
                    <p className="shrink-0 font-display text-2xl">£{job.budget.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
