"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
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
    <div className="min-h-screen overflow-x-hidden bg-[#f1f3f7] text-[#0d1117]">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 pb-20 pt-14 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            {platformRating ? (
              <div className="mb-6 inline-flex items-center gap-2.5">
                <span className="font-display text-sm font-extrabold text-[#16255c]">
                  {platformRating.avg.toFixed(1)} ★
                </span>
                <span className="h-3 w-px bg-[#0d1117]/15" />
                <span className="text-xs font-semibold text-[#5b6472]">
                  {platformRating.count} reviews from real brands
                </span>
              </div>
            ) : (
              <p className="mb-6 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#16255c]">
                Founding cohort now open
              </p>
            )}

            <h1 className="font-display text-[13vw] font-extrabold leading-[0.92] tracking-[-0.04em] sm:text-[72px] lg:text-[104px]">
              Small
              <br />
              audience.
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Serious money.</span>
                {/* Lime highlight sitting behind the type rather than as another box */}
                <span
                  aria-hidden
                  className="absolute bottom-[0.1em] left-0 z-0 h-[0.32em] w-full bg-[#c8f23c]"
                />
              </span>
            </h1>

            <p className="mt-8 max-w-[520px] text-lg leading-8 text-[#5b6472]">
              Stop chasing agencies and waiting on discovery calls. Post a brief with a real fee attached, get matched
              with UK micro-influencers who actually reply, and pay only when the work lands.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-[10px] bg-[#16255c] px-7 py-4 text-center text-base font-bold text-white shadow-[0_2px_8px_rgba(22,37,92,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#1d3078] hover:shadow-[0_6px_18px_rgba(22,37,92,0.28)]"
              >
                I&apos;m a creator
              </Link>
              <Link
                href="/signup"
                className="rounded-[10px] bg-[#0d1117]/[0.04] px-7 py-4 text-center text-base font-bold text-[#0d1117] transition-colors hover:bg-[#0d1117]/[0.08]"
              >
                I&apos;m a brand
              </Link>
            </div>

            {/* Stats — type hierarchy and space, no boxes */}
            <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6">
              {[
                { value: "100%", label: "Escrow protected" },
                { value: "£0", label: "For creators to join" },
                { value: "∞", label: "Free revisions" },
                { value: "UK", label: "Built for UK brands" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-3xl font-extrabold tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold text-[#5b6472]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-[#0d1117] shadow-[0_20px_50px_rgba(13,17,23,0.18)]">
              {loading ? (
                <div className="h-full w-full animate-pulse bg-[#161b24]" />
              ) : heroCreator?.avatar_url ? (
                <Link href={`/creators/${heroCreator.id}`} className="block h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroCreator.avatar_url}
                    alt={heroCreator.display_name ?? ""}
                    className="h-full w-full object-cover"
                  />
                </Link>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/hero-lovable-reference.jpg"
                  alt="A UK content creator filming with a phone gimbal"
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            {heroPrice && heroCreator ? (
              <div className="absolute -bottom-5 -left-5 rounded-[12px] bg-[#c8f23c] px-5 py-4 shadow-[0_10px_28px_rgba(13,17,23,0.18)]">
                <p className="font-display text-2xl font-extrabold text-[#101a3d]">£{heroPrice.toLocaleString()}</p>
                <p className="text-xs font-semibold text-[#101a3d]/70">
                  per reel · {(heroCreator.display_name ?? "Creator").split(" ")[0]}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── NICHE TICKER ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden bg-[#0d1117] py-4">
        <div className="flex w-max animate-[marquee_34s_linear_infinite] gap-12">
          {[...NICHE_CATEGORIES, ...NICHE_CATEGORIES].map((cat, i) => (
            <span key={i} className="shrink-0 text-sm font-bold uppercase tracking-[0.14em] text-[#8891a3]">
              {cat.name}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>

      {/* ── HOW IT RUNS ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-24">
        <h2 className="font-display text-4xl font-extrabold tracking-tight">How it runs</h2>
        <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {[
            { n: "01", title: "Post it or profile it", body: "Brands write a brief with a real fee attached — no vague budgets. Creators build a profile that shows their actual work, not a CV." },
            { n: "02", title: "Match, no middlemen", body: "Apply in two taps, or a brand invites you directly. No discovery calls, no agency in the middle taking a cut of the conversation." },
            { n: "03", title: "Escrow, then paid", body: "Funds lock the moment you're hired and release once the work's approved — or on a fixed timer if nobody clicks approve." },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 90}>
              <div>
                <span className="font-display text-sm font-extrabold text-[#16255c]">{step.n}</span>
                <span className="ml-3 inline-block h-px w-10 translate-y-[-4px] bg-[#c8f23c]" />
                <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{step.title}</h3>
                <p className="mt-3 leading-7 text-[#5b6472]">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CREATORS ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 pb-24">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">Meet the creators</h2>
          <Link href="/creators" className="text-sm font-bold text-[#16255c] hover:underline">
            All creators →
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-[14px] bg-[#0d1117]/[0.05]" />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="rounded-[16px] bg-white px-6 py-16 text-center shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.05)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#c8f23c]">
              <svg className="h-7 w-7 text-[#101a3d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <h3 className="mt-5 font-display text-xl font-extrabold">The founding cohort is being built</h3>
            <p className="mx-auto mt-2 max-w-md leading-6 text-[#5b6472]">
              We&apos;re onboarding the first UK creators by hand. Join early and your profile is one of the first a brand sees.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-[10px] bg-[#16255c] px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            >
              Join as a creator
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {creators.map((creator, i) => {
              const price = getStartingPrice(creator.packages)
              const tier = getCreatorTier(creator.reviewCount, creator.avgRating)
              const igFollowers = getPlatformFollowers(creator.platform_stats, "instagram")
              return (
                <Reveal key={creator.id} delay={Math.min(i, 4) * 70} className="h-full">
                  <Link href={`/creators/${creator.id}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[#0d1117]/[0.06] shadow-[0_1px_3px_rgba(13,17,23,0.06)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_32px_rgba(13,17,23,0.14)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={creator.avatar_url ?? getNicheImage(creator.niche)}
                        alt={creator.display_name ?? ""}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      {creator.avgRating !== null ? (
                        <span className="absolute left-3 top-3 rounded-full bg-[#c8f23c] px-2.5 py-1 text-[11px] font-extrabold text-[#101a3d]">
                          {creator.avgRating.toFixed(1)} ★
                        </span>
                      ) : null}
                      {price ? (
                        <span className="absolute bottom-3 right-3 rounded-full bg-[#0d1117]/80 px-3 py-1 text-[11px] font-extrabold text-white backdrop-blur-sm">
                          from £{price}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3.5">
                      <p className="font-display text-base font-extrabold">{creator.display_name ?? "Creator"}</p>
                      <p className="mt-0.5 truncate text-sm text-[#5b6472]">
                        {creator.niche ?? "Content creator"}
                        {igFollowers ? ` · ${(igFollowers / 1000).toFixed(0)}k followers` : ""}
                      </p>
                      <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tier.className}`}>
                        {tier.label}
                      </span>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        )}
      </section>

      {/* ── LIVE BRIEFS (full-bleed ink) ─────────────────────────────────── */}
      <section className="bg-[#0d1117] py-24 text-[#f1f3f7]">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              Live briefs,
              <br />
              <span className="text-[#c8f23c]">right now</span>
            </h2>
            <p className="mt-7 max-w-md text-lg leading-7 text-[#8891a3]">
              Every brief shows the fee before you apply — not after a call, not after a DM. If it doesn&apos;t say the
              price, it&apos;s not on RealReach.
            </p>
            <Link
              href="/campaigns"
              className="mt-9 inline-block rounded-[10px] bg-[#c8f23c] px-6 py-3.5 text-sm font-bold text-[#101a3d] transition-all hover:-translate-y-0.5"
            >
              Browse all{openJobCount !== null && openJobCount > 0 ? ` ${openJobCount}` : ""} briefs
            </Link>
          </div>

          <div>
            {openJobs.length === 0 ? (
              <div className="rounded-[16px] bg-[#161b24] px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#c8f23c]">
                  <svg className="h-7 w-7 text-[#101a3d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mt-5 font-display text-xl font-extrabold text-[#f1f3f7]">
                  Founding brands are being onboarded
                </p>
                <p className="mx-auto mt-2 max-w-sm leading-6 text-[#8891a3]">
                  The first briefs go live shortly. Get a profile up now so you&apos;re in the pool when they do.
                </p>
                <Link
                  href="/signup"
                  className="mt-6 inline-block rounded-[10px] bg-[#c8f23c] px-6 py-3 text-sm font-bold text-[#101a3d] transition-all hover:-translate-y-0.5"
                >
                  Create a profile
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {openJobs.map((job, i) => (
                  <Reveal key={job.id} delay={i * 70}>
                    <Link
                      href="/campaigns"
                      className="flex items-center justify-between gap-4 rounded-[12px] bg-[#161b24] p-6 transition-all hover:-translate-y-0.5 hover:bg-[#1d2430]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-display text-xl font-extrabold">{job.title}</p>
                        <p className="mt-1 text-sm text-[#8891a3]">{job.brand_name}</p>
                      </div>
                      <p className="shrink-0 font-display text-2xl font-extrabold text-[#c8f23c]">
                        £{job.budget.toLocaleString()}
                      </p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0d1117] px-5 pb-14 pt-4 text-[#8891a3]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 border-t border-white/[0.08] pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f1f3f7]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/creators" className="transition-colors hover:text-[#c8f23c]">Browse Creators</Link>
            <Link href="/campaigns" className="transition-colors hover:text-[#c8f23c]">Campaigns</Link>
            <Link href="/events" className="transition-colors hover:text-[#c8f23c]">Events</Link>
            <Link href="/pricing" className="transition-colors hover:text-[#c8f23c]">Pricing</Link>
            <Link href="/help" className="transition-colors hover:text-[#c8f23c]">Help</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
