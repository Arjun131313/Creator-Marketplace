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
import { getCreatorTier } from "@/lib/creator-tier"
import { getNicheImage } from "@/lib/niches"

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

function totalFollowers(stats: PlatformStats | null): number {
  if (!stats) return 0
  return (
    (getPlatformFollowers(stats, "instagram") ?? 0) +
    (getPlatformFollowers(stats, "tiktok") ?? 0) +
    (getPlatformFollowers(stats, "snapchat") ?? 0)
  )
}

const PLATFORM_CONFIG = [
  { key: "instagram" as const, label: "Instagram" },
  { key: "tiktok" as const, label: "TikTok" },
  { key: "snapchat" as const, label: "Snapchat" },
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
      <div className="min-h-screen bg-[#f5f3ee]">
        <PublicNav />
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin border-2 border-[#1a54f0] border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f5f3ee]">
        <PublicNav />
        <div className="mx-auto max-w-[1400px] px-5 py-16">
          <div className="border-2 border-[#10141b] bg-white p-16 text-center">
            <p className="font-display text-2xl font-extrabold">{error ?? "Creator not found"}</p>
            <Link href="/creators" className="mt-6 inline-block bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white">
              Browse creators
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  const totalFol = totalFollowers(profile.platform_stats)
  const platforms = PLATFORM_CONFIG.filter((p) => getPlatformFollowers(profile.platform_stats, p.key) !== null)
  const contentUrls = (profile.content_urls ?? []) as ContentUrl[]
  const tier = getCreatorTier(reviews.length, avgRating)
  const nameParts = (profile.display_name ?? "Creator").split(" ")

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-8">
        <div className="grid gap-8 lg:grid-cols-[646fr_754fr]">
          <div className="relative aspect-[646/807] w-full overflow-hidden bg-[#10141b]">
            <img
              src={profile.avatar_url ?? getNicheImage(profile.niche)}
              alt={profile.display_name ?? "Creator"}
              className="h-full w-full object-cover"
            />
            <span className="absolute right-4 top-4 flex items-center gap-1.5 bg-[#10141b]/70 px-3 py-1.5 text-xs font-bold uppercase text-white">
              <span className={`h-1.5 w-1.5 rounded-full ${profile.available ? "bg-[#c8f23c]" : "bg-white/40"}`} />
              {profile.available ? "Available" : "Busy"}
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#595e66]">
              {profile.niche ?? "Content creator"}
            </p>
            <h1 className="font-display text-[13vw] font-extrabold leading-[0.85] tracking-[-0.035em] sm:text-7xl lg:text-[128px]">
              {nameParts[0]}
              {nameParts.length > 1 && (
                <>
                  <br />
                  {nameParts.slice(1).join(" ")}
                </>
              )}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 text-[11px] font-bold uppercase ${tier.className}`}>{tier.label}</span>
            </div>

            <p className="mt-6 max-w-md text-lg leading-7 text-[#595e66]">
              {profile.bio ?? "No bio provided."}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-[#10141b]/10 pt-6 sm:grid-cols-4">
              <div>
                <p className="font-display text-2xl font-extrabold">{totalFol > 0 ? formatFollowers(totalFol) : "—"}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Followers</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold">{avgRating !== null ? avgRating.toFixed(1) : "—"}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Rating</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold">{jobsCompleted}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Jobs done</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold">{reviews.length}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#595e66]">Reviews</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowHireModal(true)}
                className="border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Hire {nameParts[0]}
              </button>
              <button
                onClick={handleContact}
                disabled={isStarting}
                className="border-2 border-[#10141b] px-6 py-3.5 text-sm font-bold text-[#10141b] transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee] disabled:opacity-60"
              >
                {isStarting ? "Starting…" : `Message ${nameParts[0]}`}
              </button>
            </div>
            {convError && <p className="mt-2 text-sm text-[#ff534b]">{convError}</p>}
          </div>
        </div>
      </section>

      {/* ── Platform stats ────────────────────────────────────────────────── */}
      {platforms.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-6">
          <div className="flex flex-wrap gap-3">
            {platforms.map((p) => {
              const followers = getPlatformFollowers(profile.platform_stats, p.key)
              const username = getPlatformUsername(profile.platform_stats, p.key)
              if (!followers) return null
              return (
                <div key={p.key} className="border-2 border-[#10141b]/10 bg-white px-5 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#595e66]">{p.label}</p>
                  <p className="font-display text-xl font-extrabold">{formatFollowers(followers)}</p>
                  {username && <p className="mt-0.5 text-xs text-[#1a54f0]">{username}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Specializations ───────────────────────────────────────────────── */}
      {(profile.content_types ?? []).length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-6">
          <div className="flex flex-wrap gap-2">
            {(profile.content_types ?? []).map((t) => (
              <span key={t} className="border-2 border-[#10141b]/15 px-3 py-1.5 text-sm text-[#10141b]">{t}</span>
            ))}
          </div>
        </section>
      )}

      {/* ── Packages ──────────────────────────────────────────────────────── */}
      {(profile.packages ?? []).length > 0 && (
        <section className="bg-[#10141b] py-20 text-[#f5f3ee]">
          <div className="mx-auto max-w-[1400px] px-5">
            <h2 className="font-display text-4xl font-extrabold">Content packages</h2>
            <p className="mt-2 text-[#a8adb6]">Fixed-price solutions tailored for brand growth.</p>
            <div className="mt-10 grid gap-px border border-[#f5f3ee]/12 bg-[#f5f3ee]/12 md:grid-cols-3">
              {(profile.packages ?? []).map((pkg, i) => {
                const isPopular = i === 1
                return (
                  <div key={i} className={`flex flex-col bg-[#10141b] p-8 ${isPopular ? "ring-2 ring-inset ring-[#1a54f0]" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wide text-[#a8adb6]">{pkg.name}</span>
                      {isPopular && <span className="bg-[#1a54f0] px-2 py-1 text-[10px] font-extrabold text-white">POPULAR</span>}
                    </div>
                    <p className="mt-4 font-display text-4xl font-extrabold">£{pkg.price.toLocaleString()}</p>
                    <p className="mt-4 flex-grow text-sm leading-6 text-[#a8adb6]">
                      {pkg.description || "Package tailored for your brand needs."}
                    </p>
                    <button
                      onClick={() => setShowHireModal(true)}
                      className={`mt-8 border-2 border-[#f5f3ee] py-3 text-sm font-bold transition-colors ${isPopular ? "bg-[#1a54f0] border-[#1a54f0] text-white hover:opacity-90" : "text-[#f5f3ee] hover:bg-[#f5f3ee] hover:text-[#10141b]"}`}
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

      {/* ── Portfolio ─────────────────────────────────────────────────────── */}
      {contentUrls.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-20">
          <h2 className="font-display text-4xl font-extrabold">Portfolio</h2>
          <p className="mt-2 text-[#595e66]">Content across platforms.</p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contentUrls.slice(0, 4).map((cu, i) => (
              <a
                key={i}
                href={cu.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex aspect-[16/10] flex-col items-center justify-center border-2 border-[#10141b]/15 bg-white p-6 text-center transition-colors hover:border-[#10141b]"
              >
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#1a54f0]">
                  {cu.platform === "tiktok" ? "TikTok" : "Instagram"}
                </p>
                <p className="mt-2 line-clamp-2 break-all text-sm text-[#595e66]">
                  {cu.url.replace(/https?:\/\/(www\.)?/, "")}
                </p>
                <span className="mt-3 text-xs font-bold text-[#10141b] underline">View post →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-20">
          <h2 className="font-display text-4xl font-extrabold">Reviews</h2>
          {avgRating !== null && (
            <p className="mt-2 text-[#595e66]">
              {avgRating.toFixed(1)}/5.0 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </p>
          )}
          <div ref={reviewScrollRef} className="mt-8 flex cursor-grab select-none gap-4 overflow-x-auto pb-4">
            {reviews.map((review) => (
              <div key={review.id} className="min-w-[320px] max-w-[320px] shrink-0 border-2 border-[#10141b]/15 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-[#eae8e1]">
                    {review.brand_avatar ? (
                      <img src={review.brand_avatar} alt={review.brand_name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#595e66]">·</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{review.brand_name}</p>
                    <p className="text-xs text-[#595e66]">
                      {new Date(review.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#1a54f0]">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                <p className="mt-3 text-sm leading-6 text-[#595e66]">&ldquo;{review.comment}&rdquo;</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#10141b]/10 bg-[#10141b] px-5 py-12 text-[#a8adb6]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f5f3ee]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/creators" className="hover:text-[#f5f3ee]">Browse Creators</Link>
            <Link href="/how-it-works" className="hover:text-[#f5f3ee]">How it Works</Link>
            <Link href="/privacy" className="hover:text-[#f5f3ee]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#f5f3ee]">Terms</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />

      {/* ── Hire Modal ─────────────────────────────────────────────────────── */}
      {showHireModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10141b]/70 p-4">
          <div className="w-full max-w-md border-2 border-[#10141b] bg-[#f5f3ee] p-8">
            <h3 className="font-display text-2xl font-extrabold">Hire {profile.display_name}</h3>
            <p className="mt-2 text-sm text-[#595e66]">
              You&apos;ll be taken to the job creation page to set up a campaign for this creator.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowHireModal(false)} className="px-5 py-3 text-sm font-bold text-[#595e66] hover:text-[#10141b]">
                Cancel
              </button>
              <button
                onClick={() => router.push(profile.id ? `/brand/jobs/new?creatorId=${profile.id}` : "/brand/jobs/new")}
                className="border-2 border-[#10141b] bg-[#1a54f0] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
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
