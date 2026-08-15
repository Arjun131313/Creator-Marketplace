"use client"

import Link from "next/link"
import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getPlatformFollowers } from "@/types/database"
import type { PlatformStats, CreatorPackage } from "@/types/database"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { getCreatorTier } from "@/lib/creator-tier"
import { NICHE_CATEGORIES, getNicheImage } from "@/lib/niches"

// ── Types ──────────────────────────────────────────────────────────────────────

type Creator = {
  id: string
  display_name: string | null
  bio: string | null
  niche: string | null
  avatar_url: string | null
  platform_stats: PlatformStats | null
  packages: CreatorPackage[] | null
  content_types: string[] | null
  available: boolean
  reviewCount: number
  avgRating: number | null
  startingPrice: number | null
}

type FilterKey = "platform" | "price" | "rating"

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

function getStartingPrice(packages: CreatorPackage[] | null): number | null {
  if (!packages || packages.length === 0) return null
  const prices = packages.map((p) => p.price).filter((p) => p > 0)
  return prices.length > 0 ? Math.min(...prices) : null
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BrowseCreatorsPage() {
  return (
    <Suspense fallback={null}>
      <BrowseCreatorsPageInner />
    </Suspense>
  )
}

function BrowseCreatorsPageInner() {
  const searchParams = useSearchParams()
  const [allCreators, setAllCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "")
  const [selectedNiche, setSelectedNiche] = useState<string>(searchParams.get("niche") ?? "")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("")
  const [priceRange, setPriceRange] = useState<string>("")
  const [minRating, setMinRating] = useState<number>(0)
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [displayCount, setDisplayCount] = useState(12)
  const filterRef = useRef<HTMLDivElement>(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [profilesRes, reviewsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,display_name,bio,niche,avatar_url,platform_stats,packages,content_types,available")
          .eq("role", "creator"),
        supabase.from("reviews").select("creator_id,rating"),
      ])

      if (!mounted) return

      type RawProfile = {
        id: string; display_name: string | null; bio: string | null; niche: string | null
        avatar_url: string | null; platform_stats: unknown; packages: unknown
        content_types: string[] | null; available: boolean | null
      }
      type RawReview = { creator_id: string; rating: number }
      const profiles = (profilesRes.data ?? []) as RawProfile[]
      const reviews = (reviewsRes.data ?? []) as RawReview[]

      const statsById = new Map<string, { count: number; total: number }>()
      for (const r of reviews) {
        const s = statsById.get(r.creator_id) ?? { count: 0, total: 0 }
        statsById.set(r.creator_id, { count: s.count + 1, total: s.total + r.rating })
      }

      const creators: Creator[] = profiles.map((p) => {
        const s = statsById.get(p.id)
        return {
          id: p.id,
          display_name: p.display_name,
          bio: p.bio,
          niche: p.niche,
          avatar_url: p.avatar_url,
          platform_stats: p.platform_stats as PlatformStats | null,
          packages: p.packages as CreatorPackage[] | null,
          content_types: p.content_types as string[] | null,
          available: p.available ?? true,
          reviewCount: s?.count ?? 0,
          avgRating: s ? s.total / s.count : null,
          startingPrice: getStartingPrice(p.packages as CreatorPackage[] | null),
        }
      })

      setAllCreators(creators)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  // ── Click outside to close filter dropdowns ──────────────────────────────
  useEffect(() => {
    if (!openFilter) return
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenFilter(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [openFilter])

  // ── Filter logic ─────────────────────────────────────────────────────────
  const filtered = allCreators.filter((c) => {
    const q = searchQuery.toLowerCase()
    if (
      q &&
      !(c.display_name ?? "").toLowerCase().includes(q) &&
      !(c.bio ?? "").toLowerCase().includes(q) &&
      !(c.niche ?? "").toLowerCase().includes(q) &&
      !(c.content_types ?? []).some((t) => t.toLowerCase().includes(q))
    )
      return false

    if (selectedNiche && c.niche !== selectedNiche) return false

    if (selectedPlatform) {
      const plat = selectedPlatform as keyof PlatformStats
      const followers = getPlatformFollowers(c.platform_stats, plat)
      if (!followers) return false
    }

    if (priceRange) {
      const p = c.startingPrice
      if (priceRange === "under100" && (p === null || p >= 100)) return false
      if (priceRange === "100to500" && (p === null || p < 100 || p > 500)) return false
      if (priceRange === "over500" && (p === null || p <= 500)) return false
    }

    if (minRating > 0 && (c.avgRating === null || c.avgRating < minRating)) return false

    return true
  })

  const visible = filtered.slice(0, displayCount)

  function clearAll() {
    setSelectedNiche("")
    setSelectedPlatform("")
    setPriceRange("")
    setMinRating(0)
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-[1400px] px-5 py-16 pb-24 md:pb-16">
        {/* ── Header & Search ────────────────────────────────────────────── */}
        <section className="mb-10">
          <h1 className="font-display text-[13vw] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-[80px]">
            Find your creator.
          </h1>
          <p className="mt-4 max-w-lg text-base text-[#595e66]">
            {allCreators.length} UK creators, filtered by niche, platform, and rate.
          </p>
          <input
            className="mt-6 w-full max-w-2xl border-2 border-[#10141b] bg-white px-4 py-3.5 text-sm outline-none placeholder:text-[#8b8f96] focus:bg-[#f5f3ee]"
            placeholder="Search creators, niches, or keywords..."
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </section>

        {/* ── Niche pills ─────────────────────────────────────────────────── */}
        <section className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedNiche("")}
            className={`border-2 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors ${
              !selectedNiche ? "border-[#10141b] bg-[#10141b] text-[#f5f3ee]" : "border-[#10141b]/20 text-[#595e66] hover:border-[#10141b]"
            }`}
          >
            All
          </button>
          {NICHE_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedNiche(cat.name)}
              className={`border-2 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                selectedNiche === cat.name ? "border-[#10141b] bg-[#10141b] text-[#f5f3ee]" : "border-[#10141b]/20 text-[#595e66] hover:border-[#10141b]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </section>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <section ref={filterRef} className="mb-10 flex flex-wrap items-center gap-3">
          {([
            { key: "platform" as const, label: "Platform", value: selectedPlatform, options: [
              { value: "", label: "All platforms" },
              { value: "instagram", label: "Instagram" },
              { value: "tiktok", label: "TikTok" },
              { value: "snapchat", label: "Snapchat" },
            ], set: setSelectedPlatform },
            { key: "price" as const, label: "Price", value: priceRange, options: [
              { value: "", label: "Any price" },
              { value: "under100", label: "Under £100" },
              { value: "100to500", label: "£100 – £500" },
              { value: "over500", label: "Over £500" },
            ], set: setPriceRange },
            { key: "rating" as const, label: "Rating", value: String(minRating), options: [
              { value: "0", label: "Any rating" },
              { value: "4", label: "4+ stars" },
              { value: "4.5", label: "4.5+ stars" },
              { value: "5", label: "5 stars only" },
            ], set: (v: string) => setMinRating(Number(v)) },
          ]).map((f) => (
            <div key={f.key} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === f.key ? null : f.key) }}
                className={`border-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                  openFilter === f.key || (f.value && f.value !== "0") ? "border-[#1a54f0] text-[#1a54f0]" : "border-[#10141b]/20 text-[#10141b] hover:border-[#10141b]"
                }`}
              >
                {f.label} ▾
              </button>
              {openFilter === f.key && (
                <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 z-50 mt-1 min-w-[180px] border-2 border-[#10141b] bg-white">
                  {f.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { f.set(opt.value); setOpenFilter(null) }}
                      className={`block w-full px-4 py-2.5 text-left text-sm ${f.value === opt.value ? "bg-[#1a54f0] text-white" : "text-[#10141b] hover:bg-[#eae8e1]"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(selectedNiche || selectedPlatform || priceRange || minRating > 0 || searchQuery) && (
            <button onClick={clearAll} className="text-xs font-extrabold uppercase tracking-wide text-[#595e66] underline hover:text-[#10141b]">
              Clear all
            </button>
          )}
        </section>

        {/* ── Results count ──────────────────────────────────────────────── */}
        {!loading && (
          <p className="mb-4 text-xs font-extrabold uppercase tracking-wide text-[#595e66]">
            {filtered.length} creator{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-card h-[500px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card relative overflow-hidden px-6 py-16 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(26,84,240,0.07), transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border border-[#10141b]/10 bg-[#f5f3ee] text-[#1a54f0] shadow-[var(--elev-1)]">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="mt-5 font-display text-xl font-extrabold">Nothing matches those filters</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#595e66]">
                Try widening the niche or price range — the roster is still growing, so narrow searches can come up short.
              </p>
              <button
                onClick={clearAll}
                className="mt-6 rounded-[var(--radius-sm)] border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white shadow-[var(--elev-1)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--elev-2)]"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>

            {filtered.length > displayCount && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setDisplayCount((c) => c + 12)}
                  className="border-2 border-[#10141b] px-8 py-3.5 text-sm font-extrabold uppercase tracking-wide transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee]"
                >
                  Load more creators
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <PageFooter />
      <MobileBottomNav />
    </div>
  )
}

// ── Creator Card ─────────────────────────────────────────────────────────────

function CreatorCard({ creator }: { creator: Creator }) {
  const igFollowers = getPlatformFollowers(creator.platform_stats, "instagram")
  const ttFollowers = getPlatformFollowers(creator.platform_stats, "tiktok")
  const scFollowers = getPlatformFollowers(creator.platform_stats, "snapchat")
  const tier = getCreatorTier(creator.reviewCount, creator.avgRating)
  const price = creator.startingPrice

  return (
    <Link href={`/creators/${creator.id}`} className="surface-card surface-card-hover group block overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#eae8e1]">
        <img
          src={creator.avatar_url ?? getNicheImage(creator.niche)}
          alt={creator.display_name ?? "Creator"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {creator.avgRating !== null && (
          <span className="absolute left-3 top-3 bg-[#c8f23c] px-2 py-1 text-[11px] font-extrabold text-[#182704]">
            {creator.avgRating.toFixed(1)} ★
          </span>
        )}
        <span className="absolute right-3 top-3 flex items-center gap-1 bg-[#10141b]/70 px-2 py-1 text-[10px] font-bold uppercase text-white">
          <span className={`h-1.5 w-1.5 rounded-full ${creator.available ? "bg-[#c8f23c]" : "bg-white/40"}`} />
          {creator.available ? "Available" : "Busy"}
        </span>
      </div>

      <div className="p-4">
        <p className="font-display text-2xl font-extrabold leading-none">{creator.display_name ?? "Creator"}</p>
        <p className="mt-2 truncate text-sm text-[#595e66]">
          {creator.niche ?? "Content creator"}
          {igFollowers ? ` · ${formatFollowers(igFollowers)} followers` : ttFollowers ? ` · ${formatFollowers(ttFollowers)} followers` : scFollowers ? ` · ${formatFollowers(scFollowers)} followers` : ""}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-[#10141b]/10 pt-3">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${tier.className}`}>{tier.label}</span>
          <span className="font-display text-lg font-extrabold text-[#1a54f0]">
            {price != null ? `from £${price.toLocaleString()}` : "Contact"}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function PageFooter() {
  return (
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
  )
}
