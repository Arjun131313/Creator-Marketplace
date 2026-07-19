"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getOrCreateConversationId } from "@/lib/conversations"
import { getPlatformFollowers, getPlatformUsername } from "@/types/database"
import type { PlatformStats, CreatorPackage, ContentUrl } from "@/types/database"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"

// ── Types ──────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  niche: string | null
  platform_stats: PlatformStats | null
  packages: CreatorPackage[] | null
  content_urls: ContentUrl[] | null
  content_types: string[] | null
  available: boolean
  created_at: string
}

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  brand_name: string
  brand_avatar: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
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

function totalFollowers(stats: PlatformStats | null): number {
  if (!stats) return 0
  return (
    (getPlatformFollowers(stats, "instagram") ?? 0) +
    (getPlatformFollowers(stats, "tiktok") ?? 0) +
    (getPlatformFollowers(stats, "snapchat") ?? 0)
  )
}

function FilledStars({ rating }: { rating: number }) {
  return (
    <div className="flex text-primary gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: s <= rating ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
    </div>
  )
}

// ── Platform display config ────────────────────────────────────────────────────

const PLATFORM_CONFIG = [
  { key: "instagram" as const, icon: "photo_camera", label: "Instagram" },
  { key: "tiktok" as const, icon: "video_library", label: "TikTok" },
  { key: "snapchat" as const, icon: "photo_filter", label: "Snapchat" },
]

const PACKAGE_STYLES = [
  { label: "Essential", border: "border-outline-variant", buttonClass: "border border-outline text-on-surface hover:bg-surface-container-high" },
  { label: "Growth Tier", border: "border-primary", buttonClass: "bg-primary-container text-on-primary-container hover:brightness-110" },
  { label: "Enterprise", border: "border-outline-variant", buttonClass: "border border-outline text-on-surface hover:bg-surface-container-high" },
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function CreatorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params?.id as string | undefined
  const reviewScrollRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [jobsCompleted, setJobsCompleted] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [convError, setConvError] = useState<string | null>(null)
  const [showHireModal, setShowHireModal] = useState(false)

  useEffect(() => {
    if (!profileId) return
    let mounted = true

    ;(async () => {
      const [profileRes, reviewsRes, jobsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id,display_name,bio,avatar_url,niche,platform_stats,packages,content_urls,content_types,available,created_at",
          )
          .eq("id", profileId)
          .eq("role", "creator")
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("id,rating,comment,created_at,brand_id")
          .eq("creator_id", profileId)
          .order("created_at", { ascending: false }),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", profileId)
          .eq("status", "accepted"),
      ])

      if (!mounted) return
      if (profileRes.error) { setError(profileRes.error.message); setLoading(false); return }

      setProfile(profileRes.data as Profile | null)
      setJobsCompleted(jobsRes.count ?? 0)

      const rawReviews = (reviewsRes.data ?? []) as Array<{
        id: string; rating: number; comment: string; created_at: string; brand_id: string
      }>
      if (rawReviews.length > 0) {
        const brandIds = Array.from(new Set(rawReviews.map((r) => r.brand_id)))
        const { data: brandsData } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url")
          .in("id", brandIds)
        const brands = (brandsData ?? []) as Array<{ id: string; display_name: string | null; avatar_url: string | null }>
        const nameById = new Map(brands.map((b) => [b.id, b.display_name ?? "Brand"]))
        const avatarById = new Map(brands.map((b) => [b.id, b.avatar_url ?? null]))
        if (mounted) {
          setReviews(
            rawReviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              created_at: r.created_at,
              brand_name: nameById.get(r.brand_id) ?? "Brand",
              brand_avatar: avatarById.get(r.brand_id) ?? null,
            })),
          )
        }
      }
      setLoading(false)
    })()

    return () => { mounted = false }
  }, [profileId])

  // Review scroll drag
  useEffect(() => {
    const el = reviewScrollRef.current
    if (!el) return
    let isDown = false
    let startX = 0
    let scrollLeft = 0
    const onDown = (e: MouseEvent) => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft }
    const onLeave = () => { isDown = false }
    const onUp = () => { isDown = false }
    const onMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      el.scrollLeft = scrollLeft - (x - startX) * 1.5
    }
    el.addEventListener("mousedown", onDown)
    el.addEventListener("mouseleave", onLeave)
    el.addEventListener("mouseup", onUp)
    el.addEventListener("mousemove", onMove)
    return () => {
      el.removeEventListener("mousedown", onDown)
      el.removeEventListener("mouseleave", onLeave)
      el.removeEventListener("mouseup", onUp)
      el.removeEventListener("mousemove", onMove)
    }
  }, [reviews])

  async function handleContact() {
    setConvError(null)
    setIsStarting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) { router.push("/login"); return }
    if (!profile?.id) { setConvError("Creator not found."); setIsStarting(false); return }
    try {
      const convId = await getOrCreateConversationId(session.user.id, profile.id)
      if (!convId) throw new Error("Unable to start conversation.")
      router.push(`/messages/${convId}`)
    } catch (err: unknown) {
      setConvError(err instanceof Error ? err.message : "Unable to start conversation.")
      setIsStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-[1280px] mx-auto px-gutter py-16">
          <div className="paper-card rounded-2xl p-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-[48px]">person_off</span>
            <p className="mt-4 font-headline-md text-headline-md text-on-surface">
              {error ?? "Creator not found"}
            </p>
            <Link href="/creators" className="mt-6 inline-block bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md text-label-md hover:opacity-90 transition-all">
              Browse creators
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const initials = creatorInitials(profile.display_name)
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  const totalFol = totalFollowers(profile.platform_stats)
  const platforms = PLATFORM_CONFIG.filter((p) => getPlatformFollowers(profile.platform_stats, p.key) !== null)
  const contentUrls = (profile.content_urls ?? []) as ContentUrl[]
  const tiktokUrls = contentUrls.filter((u) => u.platform === "tiktok")
  const igUrls = contentUrls.filter((u) => u.platform === "instagram")
  const allPortfolio = contentUrls.slice(0, 4)

  return (
    <div className="min-h-screen bg-background text-on-background overflow-x-hidden">
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[600px] flex flex-col justify-end">
        {/* Background */}
        <div className="absolute inset-0 z-0 bg-ink">
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-gutter w-full pb-16">
          <div className="flex flex-col md:flex-row items-end gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-surface shadow-2xl shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? "Creator"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-ink-soft flex items-center justify-center">
                  <span className="text-4xl font-medium text-on-ink/50 font-headline-md">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display-lg text-[48px] md:text-[64px] leading-none font-bold tracking-tight text-on-surface">
                  {profile.display_name ?? "Creator"}
                </h1>
                {profile.available ? (
                  <span className="bg-tertiary-container/80 text-tertiary-fixed px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse" />
                    Available
                  </span>
                ) : (
                  <span className="bg-surface-container-highest/80 text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider shrink-0">
                    Busy
                  </span>
                )}
              </div>

              {profile.niche && (
                <span className="inline-block mb-3 bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full font-label-sm text-label-sm">
                  {profile.niche}
                </span>
              )}

              <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl mb-6 leading-relaxed">
                {profile.bio ?? "No bio provided."}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Followers
                  </span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {totalFol > 0 ? formatFollowers(totalFol) : "—"}
                  </span>
                </div>
                <div className="w-px h-10 bg-white/10 self-center hidden sm:block" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Jobs Completed
                  </span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {jobsCompleted}
                  </span>
                </div>
                {avgRating !== null && (
                  <>
                    <div className="w-px h-10 bg-white/10 self-center hidden sm:block" />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                        Avg Rating
                      </span>
                      <span className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {avgRating.toFixed(1)}
                        <span className="text-on-surface-variant font-body-md text-body-md ml-1">
                          ({reviews.length})
                        </span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 pb-2 flex flex-col gap-3">
              <button
                onClick={() => setShowHireModal(true)}
                className="bg-primary-container text-on-primary-container px-8 py-3 rounded-xl font-headline-md text-[16px] font-semibold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(193,68,14,0.3)]"
              >
                Book a Consultation
              </button>
              <button
                onClick={handleContact}
                disabled={isStarting}
                className="border border-white/20 text-on-surface px-8 py-3 rounded-xl font-headline-md text-[16px] font-semibold hover:bg-white/5 transition-all disabled:opacity-60"
              >
                {isStarting ? "Starting…" : "Send a Message"}
              </button>
              {convError && (
                <p className="text-error text-sm text-center">{convError}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento: Portfolio preview + Specializations ──────────────────────── */}
      {(contentUrls.length > 0 || (profile.content_types ?? []).length > 0) && (
        <section className="py-16 max-w-[1280px] mx-auto px-gutter">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Portfolio preview (2 tiles) */}
            {contentUrls.length > 0 && (
              <div className="md:col-span-8 grid grid-cols-2 gap-4">
                {contentUrls.slice(0, 2).map((cu, i) => (
                  <a
                    key={i}
                    href={cu.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-64 rounded-2xl overflow-hidden paper-card group cursor-pointer flex flex-col items-center justify-center gap-4 p-6 hover:border-primary/40 transition-all"
                  >
                    <span className="material-symbols-outlined text-primary text-[40px]">
                      {cu.platform === "tiktok" ? "video_library" : "photo_camera"}
                    </span>
                    <div className="text-center">
                      <p className="font-label-md text-label-md text-primary uppercase tracking-wider mb-1">
                        {cu.platform === "tiktok" ? "TikTok" : "Instagram"}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-2 break-all">
                        {cu.url.replace(/https?:\/\/(www\.)?/, "")}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-primary font-label-sm text-label-sm group-hover:gap-2 transition-all">
                      View Post
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </a>
                ))}
              </div>
            )}

            {/* Specializations */}
            {(profile.content_types ?? []).length > 0 && (
              <div className={`${contentUrls.length > 0 ? "md:col-span-4" : "md:col-span-12"} paper-card rounded-2xl p-8 flex flex-col justify-center`}>
                <h3 className="font-headline-md text-headline-md mb-4 text-primary">
                  Specializations
                </h3>
                <ul className="space-y-3">
                  {(profile.content_types ?? []).map((t) => (
                    <li key={t} className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        check_circle
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Platform stats ────────────────────────────────────────────────── */}
      {platforms.length > 0 && (
        <section className="py-6 max-w-[1280px] mx-auto px-gutter">
          <div className="flex flex-wrap gap-4">
            {platforms.map((p) => {
              const followers = getPlatformFollowers(profile.platform_stats, p.key)
              const username = getPlatformUsername(profile.platform_stats, p.key)
              if (!followers) return null
              return (
                <div key={p.key} className="paper-card rounded-2xl px-6 py-4 flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary text-[28px]">{p.icon}</span>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                      {p.label}
                    </p>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface">
                      {formatFollowers(followers)}
                    </p>
                    {username && (
                      <p className="font-label-sm text-label-sm text-primary mt-0.5">{username}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Packages ──────────────────────────────────────────────────────── */}
      {(profile.packages ?? []).length > 0 && (
        <section className="py-16 bg-surface-container-low/20">
          <div className="max-w-[1280px] mx-auto px-gutter">
            <div className="text-center mb-10">
              <h2 className="font-display-lg text-display-lg font-bold mb-2">Content Packages</h2>
              <p className="text-on-surface-variant font-body-lg text-body-lg">
                Fixed-price solutions tailored for brand growth.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {(profile.packages ?? []).map((pkg, i) => {
                const style = PACKAGE_STYLES[i] ?? PACKAGE_STYLES[0]
                const isPopular = i === 1
                return isPopular ? (
                  /* Popular card — gradient border */
                  <div
                    key={i}
                    className="relative rounded-3xl p-[2px] bg-gradient-to-b from-primary to-secondary-container shadow-2xl scale-105 z-10"
                  >
                    <div className="bg-[#0f172a] rounded-[22px] p-8 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-label-md text-label-md text-primary uppercase tracking-widest">
                          {style.label}
                        </span>
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                          POPULAR
                        </span>
                      </div>
                      <h4 className="font-display-lg text-display-lg font-bold text-on-surface mb-4">
                        ${pkg.price.toLocaleString()}
                      </h4>
                      <p className="text-on-surface-variant mb-6 flex-grow leading-relaxed">
                        {pkg.description || "Our most popular package for brands ready to scale."}
                      </p>
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">done</span>
                          <span className="text-on-surface">{pkg.name} package deliverables</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowHireModal(true)}
                        className={`w-full py-4 rounded-xl font-headline-md text-[16px] font-semibold transition-all shadow-lg ${style.buttonClass}`}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard cards */
                  <div
                    key={i}
                    className="paper-card rounded-3xl p-8 flex flex-col hover:border-primary/30 transition-all"
                  >
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-2">
                      {style.label}
                    </span>
                    <h4 className="font-display-lg text-display-lg font-bold text-on-surface mb-4">
                      ${pkg.price.toLocaleString()}
                    </h4>
                    <p className="text-on-surface-variant mb-6 flex-grow leading-relaxed">
                      {pkg.description || "Package tailored for your brand needs."}
                    </p>
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">done</span>
                        <span className="text-on-surface">{pkg.name} package deliverables</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowHireModal(true)}
                      className={`w-full py-4 rounded-xl font-headline-md text-[16px] font-semibold transition-all ${style.buttonClass}`}
                    >
                      Select {pkg.name}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Portfolio Grid ─────────────────────────────────────────────────── */}
      {allPortfolio.length > 0 && (
        <section className="py-16 max-w-[1280px] mx-auto px-gutter">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-display-lg text-display-lg font-bold">Portfolio</h2>
              <p className="text-on-surface-variant">Content across platforms.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Large tile */}
            <a
              href={allPortfolio[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-[16/10] rounded-3xl overflow-hidden cursor-pointer paper-card flex items-center justify-center"
            >
              <div className="text-center p-8">
                <span className="material-symbols-outlined text-primary text-[56px]">
                  {allPortfolio[0].platform === "tiktok" ? "video_library" : "photo_camera"}
                </span>
                <p className="font-label-md text-label-md text-primary uppercase tracking-wider mt-4 mb-2">
                  {allPortfolio[0].platform === "tiktok" ? "TikTok" : "Instagram"}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant break-all line-clamp-2">
                  {allPortfolio[0].url.replace(/https?:\/\/(www\.)?/, "")}
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                <span className="text-primary font-label-sm uppercase mb-2">
                  {allPortfolio[0].platform === "tiktok" ? "TikTok" : "Instagram"}
                </span>
                <h5 className="font-headline-md text-headline-md flex items-center gap-2">
                  View Post
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </h5>
              </div>
            </a>

            {/* Right column — stacked */}
            {allPortfolio.length > 1 && (
              <div className="flex flex-col gap-8">
                {allPortfolio.slice(1, 3).map((cu, i) => (
                  <a
                    key={i}
                    href={cu.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-3xl overflow-hidden cursor-pointer paper-card h-full flex items-center justify-center min-h-[140px]"
                  >
                    <div className="text-center p-6">
                      <span className="material-symbols-outlined text-primary text-[36px]">
                        {cu.platform === "tiktok" ? "video_library" : "photo_camera"}
                      </span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 break-all line-clamp-1">
                        {cu.url.replace(/https?:\/\/(www\.)?/, "")}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <h5 className="font-headline-md text-headline-md flex items-center gap-2">
                        {cu.platform === "tiktok" ? "TikTok Post" : "Instagram Post"}
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </h5>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="py-16 bg-surface-container-lowest/50">
          <div className="max-w-[1280px] mx-auto px-gutter">
            <div className="mb-10">
              <h2 className="font-display-lg text-display-lg font-bold">Reviews</h2>
              {avgRating !== null && (
                <div className="flex items-center gap-3 mt-3">
                  <FilledStars rating={Math.round(avgRating)} />
                  <span className="font-headline-md text-headline-md font-semibold text-on-surface">
                    {avgRating.toFixed(1)}/5.0
                  </span>
                  <span className="text-on-surface-variant">
                    ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}
            </div>

            {/* Horizontal scrollable reviews */}
            <div
              ref={reviewScrollRef}
              className="flex gap-6 overflow-x-auto pb-8 snap-x cursor-grab select-none"
              style={{ scrollbarWidth: "thin" }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="min-w-[320px] md:min-w-[400px] paper-card p-8 rounded-3xl snap-start flex-shrink-0"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {review.brand_avatar ? (
                        <img
                          src={review.brand_avatar}
                          alt={review.brand_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-[24px]">
                          business
                        </span>
                      )}
                    </div>
                    <div>
                      <h6 className="font-headline-md text-[16px] font-semibold text-on-surface">
                        {review.brand_name}
                      </h6>
                      <p className="text-on-surface-variant font-label-sm text-label-sm">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex text-primary mb-4 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className="material-symbols-outlined text-[20px]"
                        style={{
                          fontVariationSettings: s <= review.rating ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-on-surface-variant italic leading-relaxed line-clamp-4">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
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
                <Link href="/creators" className="text-on-surface-variant hover:text-primary transition-colors font-body-md">
                  Browse Creators
                </Link>
                <Link href="/how-it-works" className="text-on-surface-variant hover:text-primary transition-colors font-body-md">
                  How it Works
                </Link>
              </nav>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-headline-md text-on-surface">Legal</h5>
              <nav className="flex flex-col gap-2">
                <Link href="/privacy" className="text-on-surface-variant hover:text-primary transition-colors font-body-md">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-on-surface-variant hover:text-primary transition-colors font-body-md">
                  Terms of Service
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>

      <MobileBottomNav />

      {/* ── Hire Modal ─────────────────────────────────────────────────────── */}
      {showHireModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md paper-card rounded-3xl p-8 shadow-2xl">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">
              Hire {profile.display_name}
            </h3>
            <p className="text-on-surface-variant text-sm mb-6">
              You&apos;ll be taken to the job creation page to set up a campaign for this creator.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowHireModal(false)}
                className="px-5 py-3 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors font-label-md"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  router.push(profile.id ? `/brand/jobs/new?creatorId=${profile.id}` : "/brand/jobs/new")
                }
                className="bg-primary-container text-on-primary-container px-5 py-3 rounded-xl font-label-md text-label-md hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
