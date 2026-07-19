"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getPlatformFollowers } from "@/types/database"
import type { PlatformStats, CreatorPackage, ContentUrl } from "@/types/database"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"

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

type FilterKey = "category" | "platform" | "price" | "rating"

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function creatorInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BrowseCreatorsPage() {
  const [allCreators, setAllCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNiche, setSelectedNiche] = useState<string>("")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("")
  const [priceRange, setPriceRange] = useState<string>("")
  const [minRating, setMinRating] = useState<number>(0)
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [displayCount, setDisplayCount] = useState(12)
  const filterRef = useRef<HTMLDivElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Click outside to close filter dropdowns ────────────────────────────────
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

  // ── Filter logic ───────────────────────────────────────────────────────────
  const niches = Array.from(new Set(allCreators.map((c) => c.niche).filter(Boolean) as string[])).sort()

  const filtered = allCreators.filter((c) => {
    // search
    const q = searchQuery.toLowerCase()
    if (
      q &&
      !(c.display_name ?? "").toLowerCase().includes(q) &&
      !(c.bio ?? "").toLowerCase().includes(q) &&
      !(c.niche ?? "").toLowerCase().includes(q) &&
      !(c.content_types ?? []).some((t) => t.toLowerCase().includes(q))
    )
      return false

    // niche
    if (selectedNiche && c.niche !== selectedNiche) return false

    // platform
    if (selectedPlatform) {
      const plat = selectedPlatform as keyof PlatformStats
      const followers = getPlatformFollowers(c.platform_stats, plat)
      if (!followers) return false
    }

    // price
    if (priceRange) {
      const p = c.startingPrice
      if (priceRange === "under100" && (p === null || p >= 100)) return false
      if (priceRange === "100to500" && (p === null || p < 100 || p > 500)) return false
      if (priceRange === "over500" && (p === null || p <= 500)) return false
    }

    // rating
    if (minRating > 0 && (c.avgRating === null || c.avgRating < minRating)) return false

    return true
  })

  const visible = filtered.slice(0, displayCount)

  // ── Active filters pills ────────────────────────────────────────────────────
  const activeFilters: { key: string; label: string; clear: () => void }[] = []
  if (selectedNiche) activeFilters.push({ key: "niche", label: selectedNiche, clear: () => setSelectedNiche("") })
  if (selectedPlatform)
    activeFilters.push({
      key: "platform",
      label: selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1),
      clear: () => setSelectedPlatform(""),
    })
  if (priceRange)
    activeFilters.push({
      key: "price",
      label: priceRange === "under100" ? "Under $100" : priceRange === "100to500" ? "$100–$500" : "Over $500",
      clear: () => setPriceRange(""),
    })
  if (minRating > 0)
    activeFilters.push({ key: "rating", label: `${minRating}+ stars`, clear: () => setMinRating(0) })

  function clearAll() {
    setSelectedNiche("")
    setSelectedPlatform("")
    setPriceRange("")
    setMinRating(0)
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <PublicNav />

      <main className="max-w-[1280px] mx-auto px-gutter py-16 pb-24 md:pb-16">
        {/* ── Header & Search ──────────────────────────────────────────────── */}
        <section className="relative mb-10">
          <div>
            <h1 className="font-display-lg text-display-lg font-medium mb-4">
              Explore elite <em className="not-italic italic text-primary">creators</em>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-10 leading-relaxed">
              Discover high-tier talent for your brand campaigns. Filter through verified creators across global platforms.
            </p>
          </div>
          <div className="relative w-full max-w-3xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant rounded-sm py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md"
              placeholder="Search creators, niches, or keywords..."
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <section ref={filterRef} className="flex flex-wrap items-center gap-4 mb-10">
          {/* Category */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "category" ? null : "category") }}
              className={`flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg border transition-all font-label-md text-label-md ${
                openFilter === "category" || selectedNiche
                  ? "border-primary/50 text-primary"
                  : "border-outline-variant text-on-surface hover:border-primary/50"
              }`}
            >
              Category
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </button>
            {openFilter === "category" && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full mt-2 left-0 z-50 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl p-2 min-w-[180px] max-h-64 overflow-y-auto"
              >
                <button
                  onClick={() => { setSelectedNiche(""); setOpenFilter(null) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedNiche ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}`}
                >
                  All categories
                </button>
                {niches.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setSelectedNiche(n); setOpenFilter(null) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedNiche === n ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Platform */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "platform" ? null : "platform") }}
              className={`flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg border transition-all font-label-md text-label-md ${
                openFilter === "platform" || selectedPlatform
                  ? "border-primary/50 text-primary"
                  : "border-outline-variant text-on-surface hover:border-primary/50"
              }`}
            >
              Platform
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </button>
            {openFilter === "platform" && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full mt-2 left-0 z-50 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl p-2 min-w-[160px]"
              >
                {[
                  { value: "", label: "All platforms" },
                  { value: "instagram", label: "Instagram" },
                  { value: "tiktok", label: "TikTok" },
                  { value: "snapchat", label: "Snapchat" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSelectedPlatform(opt.value); setOpenFilter(null) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPlatform === opt.value ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "price" ? null : "price") }}
              className={`flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg border transition-all font-label-md text-label-md ${
                openFilter === "price" || priceRange
                  ? "border-primary/50 text-primary"
                  : "border-outline-variant text-on-surface hover:border-primary/50"
              }`}
            >
              Price Range
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </button>
            {openFilter === "price" && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full mt-2 left-0 z-50 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl p-2 min-w-[160px]"
              >
                {[
                  { value: "", label: "Any price" },
                  { value: "under100", label: "Under $100" },
                  { value: "100to500", label: "$100 – $500" },
                  { value: "over500", label: "Over $500" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setPriceRange(opt.value); setOpenFilter(null) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${priceRange === opt.value ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "rating" ? null : "rating") }}
              className={`flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg border transition-all font-label-md text-label-md ${
                openFilter === "rating" || minRating > 0
                  ? "border-primary/50 text-primary"
                  : "border-outline-variant text-on-surface hover:border-primary/50"
              }`}
            >
              Rating
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </button>
            {openFilter === "rating" && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full mt-2 left-0 z-50 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl p-2 min-w-[160px]"
              >
                {[
                  { value: 0, label: "Any rating" },
                  { value: 4, label: "4+ stars" },
                  { value: 4.5, label: "4.5+ stars" },
                  { value: 5, label: "5 stars only" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setMinRating(opt.value); setOpenFilter(null) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${minRating === opt.value ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active filter pills */}
          {activeFilters.length > 0 && (
            <>
              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((f) => (
                  <span
                    key={f.key}
                    className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-full font-label-sm text-label-sm flex items-center gap-1"
                  >
                    {f.label}
                    <button onClick={f.clear} aria-label={`Remove ${f.label} filter`}>
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearAll}
                  className="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-3 py-1.5 rounded-full font-label-sm text-label-sm hover:text-on-surface transition-colors"
                >
                  Clear all
                </button>
              </div>
            </>
          )}
        </section>

        {/* ── Results count ────────────────────────────────────────────────── */}
        {!loading && (
          <p className="text-on-surface-variant font-label-sm text-label-sm mb-gutter">
            {filtered.length} creator{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="paper-card rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="paper-card rounded-2xl p-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-[48px]">
              manage_search
            </span>
            <p className="mt-4 font-headline-md text-headline-md text-on-surface">No creators found</p>
            <p className="mt-2 text-on-surface-variant">Try adjusting your filters or search query.</p>
            <button
              onClick={clearAll}
              className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md text-label-md hover:opacity-90 transition-all"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
              {visible.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>

            {filtered.length > displayCount && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setDisplayCount((c) => c + 12)}
                  className="inline-flex items-center gap-2 bg-surface-container border border-outline-variant hover:border-primary/50 text-on-surface px-8 py-4 rounded-xl font-label-md text-label-md transition-all hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined">expand_more</span>
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

// ── Creator Card ───────────────────────────────────────────────────────────────

function CreatorCard({ creator }: { creator: Creator }) {
  const initials = creatorInitials(creator.display_name)
  const igFollowers = getPlatformFollowers(creator.platform_stats, "instagram")
  const ttFollowers = getPlatformFollowers(creator.platform_stats, "tiktok")
  const scFollowers = getPlatformFollowers(creator.platform_stats, "snapchat")

  return (
    <article className="paper-card rounded-xl overflow-hidden flex flex-col">
      {/* Image area */}
      <div className="relative h-64 overflow-hidden bg-surface-container-low">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt={creator.display_name ?? "Creator"}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <span className="text-5xl font-medium text-on-surface-variant/40 font-headline-md">
              {initials}
            </span>
          </div>
        )}

        {/* Availability */}
        <div className="absolute top-4 left-4">
          {creator.available ? (
            <span className="bg-tertiary-container/80 backdrop-blur-md text-tertiary-fixed px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse" />
              Available Now
            </span>
          ) : (
            <span className="bg-surface-container-highest/80 backdrop-blur-md text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider">
              Busy
            </span>
          )}
        </div>

        {/* Niche badge */}
        {creator.niche && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-primary-container text-on-primary px-3 py-1 rounded-lg font-label-sm text-label-sm shadow-lg shadow-primary/20">
              {creator.niche}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-gutter flex-grow flex flex-col">
        {/* Name + Rating */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-headline-md text-headline-md text-on-surface leading-tight">
            {creator.display_name ?? "Creator"}
          </h3>
          {creator.avgRating !== null ? (
            <div className="flex items-center gap-1 text-primary shrink-0">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span className="font-label-md text-label-md">
                {creator.avgRating.toFixed(1)}
              </span>
              <span className="text-on-surface-variant text-[12px]">
                ({creator.reviewCount})
              </span>
            </div>
          ) : null}
        </div>

        {/* Platform stats */}
        <div className="flex items-center gap-6 mb-4 text-on-surface-variant flex-wrap">
          {igFollowers ? (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span className="font-label-sm text-label-sm">{formatFollowers(igFollowers)}</span>
            </div>
          ) : null}
          {ttFollowers ? (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">video_library</span>
              <span className="font-label-sm text-label-sm">{formatFollowers(ttFollowers)}</span>
            </div>
          ) : null}
          {scFollowers ? (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">photo_filter</span>
              <span className="font-label-sm text-label-sm">{formatFollowers(scFollowers)}</span>
            </div>
          ) : null}
        </div>

        {/* Content type tags */}
        {(creator.content_types ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {(creator.content_types ?? []).slice(0, 3).map((t) => (
              <span
                key={t}
                className="px-2 py-1 bg-surface-container-highest rounded font-label-sm text-[11px] text-on-surface-variant"
              >
                {t}
              </span>
            ))}
            {(creator.content_types ?? []).length > 3 && (
              <span className="px-2 py-1 bg-surface-container-highest rounded font-label-sm text-[11px] text-on-surface-variant">
                +{(creator.content_types ?? []).length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="pt-4 border-t border-outline-variant flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-label-sm tracking-widest">
              Starting Price
            </span>
            <span className="font-bold text-primary text-lg">
              {creator.startingPrice != null
                ? `From $${creator.startingPrice.toLocaleString()}`
                : "Contact"}
            </span>
          </div>
          <Link
            href={`/creators/${creator.id}`}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            View Profile
          </Link>
        </div>
      </div>
    </article>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function PageFooter() {
  return (
    <footer className="w-full py-16 px-gutter bg-surface-container-lowest border-t border-outline-variant">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-[1280px] mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">hub</span>
            <span className="font-headline-lg font-bold text-primary">CreatorHub</span>
          </div>
          <p className="text-on-surface-variant font-body-md text-body-md max-w-xs">
            Connecting the world&apos;s most talented creators with elite brands.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4">
            © 2024 CreatorHub. All rights reserved.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:col-span-2">
          <div className="flex flex-col gap-4">
            <h5 className="font-headline-md text-on-surface">Explore</h5>
            <nav className="flex flex-col gap-2">
              <Link href="/creators" className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md">
                For Brands
              </Link>
              <Link href="/creator/dashboard" className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md">
                For Creators
              </Link>
              <Link href="/how-it-works" className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md">
                How it Works
              </Link>
            </nav>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="font-headline-md text-on-surface">Legal</h5>
            <nav className="flex flex-col gap-2">
              <Link href="/privacy" className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md">
                Terms of Service
              </Link>
              <Link href="/help" className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md">
                Support
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
