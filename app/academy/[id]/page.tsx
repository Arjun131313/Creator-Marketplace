"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import PublicNav from "@/components/public-nav"
import { supabase } from "@/lib/supabase"

type Lesson = {
  id: string
  title: string
  description: string
  price: number
  category: string | null
  creator_id: string
  teacher_name: string
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

      const { data: teacherProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", lessonRow.creator_id)
        .maybeSingle()

      setLesson({ ...lessonRow, teacher_name: teacherProfile?.display_name ?? "Creator" })

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
      <div className="min-h-screen bg-[#f5f3ee]">
        <PublicNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-[#595e66]">Loading lesson…</p>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-[#f5f3ee]">
        <PublicNav />
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="border-2 border-[#ff534b] bg-white p-8 text-[#ff534b]">{error ?? "Lesson not found."}</div>
        </div>
      </div>
    )
  }

  const isOwnLesson = lesson.creator_id === userId

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <Link href="/academy" className="text-sm font-bold text-[#1a54f0] hover:underline">
          ← Back to Academy
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {lesson.category ? (
            <span className="bg-[#c8f23c] px-2.5 py-1 text-[11px] font-bold uppercase text-[#182704]">{lesson.category}</span>
          ) : null}
          <span className="text-xs font-bold uppercase tracking-wide text-[#8b8f96]">By {lesson.teacher_name}</span>
        </div>

        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">{lesson.title}</h1>

        <div className="mt-6 border-2 border-[#10141b]/10 bg-white p-6">
          <p className="whitespace-pre-line text-sm leading-7 text-[#10141b]">{lesson.description}</p>
        </div>

        {purchaseStatus === "success" && !hasAccess ? (
          <div className="mt-6 border-2 border-[#feb930] bg-[#feb930]/10 p-4 text-sm text-[#2b1d00]">
            Payment received — this can take a few seconds to confirm. Refresh in a moment to unlock the lesson.
          </div>
        ) : null}

        <div className="mt-6 border-2 border-[#10141b] bg-white p-6">
          {isOwnLesson ? (
            <>
              <p className="text-sm font-bold text-[#10141b]">This is your lesson</p>
              {contentUrl ? (
                <a href={contentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-[#1a54f0] underline">
                  View content link
                </a>
              ) : (
                <p className="mt-2 text-sm text-[#595e66]">No content link set yet.</p>
              )}
            </>
          ) : hasAccess ? (
            <>
              <p className="text-sm font-bold text-[#182704]">You own this lesson</p>
              {contentUrl ? (
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center justify-center border-2 border-[#10141b] bg-[#c8f23c] px-5 py-2.5 text-sm font-bold text-[#182704] transition-opacity hover:opacity-90"
                >
                  Open lesson content
                </a>
              ) : (
                <p className="mt-2 text-sm text-[#595e66]">Content link unavailable — contact support.</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-extrabold text-[#1a54f0]">£{lesson.price.toLocaleString()}</span>
                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="inline-flex items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {buying ? "Redirecting…" : "Buy this lesson"}
                </button>
              </div>
              <p className="mt-3 text-xs text-[#8b8f96]">
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
