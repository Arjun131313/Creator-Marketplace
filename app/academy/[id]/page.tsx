"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import PublicNav from "@/components/public-nav"
import { supabase } from "@/lib/supabase"
import { getCreatorTier } from "@/lib/creator-tier"

type Lesson = {
  id: string
  title: string
  description: string
  price: number
  category: string | null
  creator_id: string
  teacher_name: string
  teacher_avatar: string | null
  teacher_niche: string | null
  teacher_bio: string | null
  teacher_review_count: number
  teacher_avg_rating: number | null
}

export default function AcademyLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const purchaseStatus = searchParams.get("purchase")

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [contentUrl, setContentUrl] = useState<string | null>(null)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: lessonRow, error: lessonError } = await supabase
        .from("academy_lessons")
        .select("id,title,description,price,category,creator_id")
        .eq("id", id)
        .single()

      if (lessonError || !lessonRow) {
        setError("Lesson not found.")
        setLoading(false)
        return
      }

      const [{ data: teacherProfile }, { data: reviews }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name,avatar_url,niche,bio")
          .eq("id", lessonRow.creator_id)
          .maybeSingle(),
        supabase.from("reviews").select("rating").eq("creator_id", lessonRow.creator_id),
      ])

      const reviewCount = reviews?.length ?? 0
      const avgRating = reviewCount > 0 ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null

      setLesson({
        ...lessonRow,
        teacher_name: teacherProfile?.display_name ?? "Creator",
        teacher_avatar: teacherProfile?.avatar_url ?? null,
        teacher_niche: teacherProfile?.niche ?? null,
        teacher_bio: teacherProfile?.bio ?? null,
        teacher_review_count: reviewCount,
        teacher_avg_rating: avgRating,
      })

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.id) {
        setUserId(session.user.id)

        const isOwnLesson = lessonRow.creator_id === session.user.id
        let owns = isOwnLesson

        if (!owns) {
          const { data: purchase } = await supabase
            .from("academy_purchases")
            .select("id")
            .eq("lesson_id", id)
            .eq("buyer_id", session.user.id)
            .eq("status", "paid")
            .maybeSingle()
          owns = Boolean(purchase)
        }

        setHasAccess(owns)

        if (owns) {
          const { data: content } = await supabase
            .from("academy_lesson_content")
            .select("content_url")
            .eq("lesson_id", id)
            .maybeSingle()
          setContentUrl(content?.content_url ?? null)
        }
      }

      setLoading(false)
    }

    load()
  }, [id])

  async function handleBuy() {
    setBuying(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push("/login")
      return
    }

    const response = await fetch("/api/academy/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ lessonId: id }),
    })

    const data = (await response.json()) as { url?: string; error?: string }

    if (!response.ok || !data.url) {
      setError(data.error ?? "Failed to start checkout")
      setBuying(false)
      return
    }

    window.location.href = data.url
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f3f7]">
        <PublicNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-[#5b6472]">Loading lesson…</p>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-[#f1f3f7]">
        <PublicNav />
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 p-8 text-[#ff534b]">{error ?? "Lesson not found."}</div>
        </div>
      </div>
    )
  }

  const isOwnLesson = lesson.creator_id === userId

  return (
    <div className="min-h-screen bg-[#f1f3f7] text-[#0d1117]">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <Link href="/academy" className="text-sm font-bold text-[#16255c] hover:underline">
          ← Back to Academy
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {lesson.category ? (
            <span className="bg-[#c8f23c] px-2.5 py-1 text-[11px] font-bold uppercase text-[#101a3d]">{lesson.category}</span>
          ) : null}
        </div>

        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">{lesson.title}</h1>

        <div className="mt-6 rounded-[12px] bg-white ring-1 ring-[#0d1117]/[0.05] p-6">
          <p className="whitespace-pre-line text-sm leading-7 text-[#0d1117]">{lesson.description}</p>
        </div>

        {/* About the teacher */}
        <Link
          href={`/creators/${lesson.creator_id}`}
          className="mt-6 flex items-start gap-4 rounded-[12px] bg-white ring-1 ring-[#0d1117]/[0.05] p-6 transition-colors hover:bg-[#e4e7ee]/40"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e4e7ee]">
            {lesson.teacher_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lesson.teacher_avatar} alt={lesson.teacher_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-[#5b6472]">{lesson.teacher_name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-extrabold text-[#0d1117]">{lesson.teacher_name}</p>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${getCreatorTier(lesson.teacher_review_count, lesson.teacher_avg_rating).className}`}>
                {getCreatorTier(lesson.teacher_review_count, lesson.teacher_avg_rating).label}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-[#8b93a3]">
              {lesson.teacher_niche ?? "Content creator"}
              {lesson.teacher_review_count > 0 ? ` · ${lesson.teacher_avg_rating?.toFixed(1)} ★ (${lesson.teacher_review_count} review${lesson.teacher_review_count !== 1 ? "s" : ""})` : ""}
            </p>
            {lesson.teacher_bio ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5b6472]">{lesson.teacher_bio}</p>
            ) : null}
            <p className="mt-2 text-xs font-bold text-[#16255c]">View full profile →</p>
          </div>
        </Link>

        {purchaseStatus === "success" && !hasAccess ? (
          <div className="mt-6 rounded-[12px] bg-[#feb930]/15 p-4 text-sm text-[#2b1d00]">
            Payment received — this can take a few seconds to confirm. Refresh in a moment to unlock the lesson.
          </div>
        ) : null}

        <div className="mt-6 rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6">
          {isOwnLesson ? (
            <>
              <p className="text-sm font-bold text-[#0d1117]">This is your lesson</p>
              {contentUrl ? (
                <a href={contentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-[#16255c] underline">
                  View content link
                </a>
              ) : (
                <p className="mt-2 text-sm text-[#5b6472]">No content link set yet.</p>
              )}
            </>
          ) : hasAccess ? (
            <>
              <p className="text-sm font-bold text-[#101a3d]">You own this lesson</p>
              {contentUrl ? (
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center justify-center rounded-[8px] bg-[#c8f23c] px-5 py-2.5 text-sm font-bold text-[#101a3d] transition-opacity hover:opacity-90"
                >
                  Open lesson content
                </a>
              ) : (
                <p className="mt-2 text-sm text-[#5b6472]">Content link unavailable — contact support.</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-extrabold text-[#16255c]">£{lesson.price.toLocaleString()}</span>
                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="inline-flex items-center justify-center rounded-[8px] bg-[#16255c] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {buying ? "Redirecting…" : "Buy this lesson"}
                </button>
              </div>
              <p className="mt-3 text-xs text-[#8b93a3]">
                Instant access once payment goes through — no escrow wait, this isn&apos;t a delivered job.
              </p>
            </>
          )}

          {error ? <p className="mt-3 text-sm text-[#ff534b]">{error}</p> : null}
        </div>
      </main>
    </div>
  )
}
