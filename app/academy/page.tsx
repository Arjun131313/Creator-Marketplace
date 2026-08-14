"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { supabase } from "@/lib/supabase"

type Lesson = {
  id: string
  title: string
  description: string
  price: number
  category: string | null
  created_at: string
  creator_id: string
  teacher_name: string
}

const CATEGORIES = ["All", "Pitching", "Content creation", "Negotiation", "Growth", "Other"]

export default function AcademyPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("All")

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("academy_lessons")
        .select("id,title,description,price,category,created_at,creator_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })

      const lessonsList = data ?? []

      if (lessonsList.length === 0) {
        setLessons([])
        setLoading(false)
        return
      }

      const creatorIds = Array.from(new Set(lessonsList.map((l) => l.creator_id)))
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", creatorIds)

      const nameById = new Map(profiles?.map((p) => [p.id, p.display_name ?? "Creator"]))

      setLessons(
        lessonsList.map((l) => ({
          ...l,
          teacher_name: nameById.get(l.creator_id) ?? "Creator",
        })),
      )
      setLoading(false)
    }

    load()
  }, [])

  const filteredLessons = useMemo(() => {
    if (category === "All") return lessons
    return lessons.filter((l) => l.category === category)
  }, [lessons, category])

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-[1400px] px-5 py-16 pb-24 md:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1a54f0]">
              Creator Academy
            </p>
            <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
              Learn from creators who&apos;ve done it.
            </h1>
            <p className="mt-3 max-w-lg text-[#595e66]">
              Paid lessons from real RealReach creators — how to pitch, price, and get hired more.
            </p>
          </div>

          <Link
            href="/creator/academy/new"
            className="inline-flex shrink-0 items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Teach a lesson
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`border-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.06em] transition-colors ${
                category === c
                  ? "border-[#10141b] bg-[#10141b] text-[#f5f3ee]"
                  : "border-[#10141b]/20 text-[#595e66] hover:border-[#10141b]/50 hover:text-[#10141b]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 animate-pulse border-2 border-[#10141b]/10 bg-white" />
            ))}
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="mt-8 border-2 border-dashed border-[#10141b]/20 p-16 text-center">
            <p className="text-[#595e66]">No lessons here yet.</p>
            <Link href="/creator/academy/new" className="mt-3 inline-block text-sm font-bold text-[#1a54f0] hover:underline">
              Be the first to teach one →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/academy/${lesson.id}`}
                className="flex flex-col border-2 border-[#10141b] bg-white transition-colors hover:bg-[#eae8e1]/40"
              >
                <div className="flex items-center justify-between border-b-2 border-[#10141b]/10 p-5">
                  <span className="font-display text-2xl font-extrabold text-[#1a54f0]">£{lesson.price.toLocaleString()}</span>
                  {lesson.category ? (
                    <span className="bg-[#c8f23c] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#182704]">
                      {lesson.category}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 p-5">
                  <h2 className="font-display text-xl font-extrabold tracking-tight">{lesson.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#595e66]">{lesson.description}</p>
                </div>
                <div className="border-t-2 border-[#10141b]/10 p-5 text-xs font-bold uppercase tracking-wide text-[#8b8f96]">
                  By {lesson.teacher_name}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#10141b]/10 bg-[#10141b] px-5 py-12 text-[#a8adb6]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f5f3ee]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/creators" className="hover:text-[#f5f3ee]">Browse Creators</Link>
            <Link href="/campaigns" className="hover:text-[#f5f3ee]">Campaigns</Link>
            <Link href="/how-it-works" className="hover:text-[#f5f3ee]">How it Works</Link>
            <Link href="/help" className="hover:text-[#f5f3ee]">Help Center</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
