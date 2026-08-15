"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import EmptyState from "@/components/empty-state"
import Reveal from "@/components/reveal"
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
  teacher_avatar: string | null
  teacher_niche: string | null
}

type CategoryInfo = {
  name: string
  description: string
  icon: string
}

const CATEGORY_INFO: CategoryInfo[] = [
  { name: "Pitching", description: "How to apply, what to say, and how to stand out in a brief", icon: "✎" },
  { name: "Content creation", description: "Shooting, editing, and delivering content brands actually want", icon: "◉" },
  { name: "Negotiation", description: "Setting your rates and holding them without losing the job", icon: "⇄" },
  { name: "Growth", description: "Building an audience and a portfolio that gets you hired again", icon: "↗" },
  { name: "Other", description: "Everything else creators have learned the hard way", icon: "＋" },
]

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
        .select("id,display_name,avatar_url,niche")
        .in("id", creatorIds)

      const profileById = new Map(
        profiles?.map((p) => [p.id, { name: p.display_name ?? "Creator", avatar: p.avatar_url, niche: p.niche }]),
      )

      setLessons(
        lessonsList.map((l) => {
          const profile = profileById.get(l.creator_id)
          return {
            ...l,
            teacher_name: profile?.name ?? "Creator",
            teacher_avatar: profile?.avatar ?? null,
            teacher_niche: profile?.niche ?? null,
          }
        }),
      )
      setLoading(false)
    }

    load()
  }, [])

  const filteredLessons = useMemo(() => {
    if (category === "All") return lessons
    return lessons.filter((l) => l.category === category)
  }, [lessons, category])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    lessons.forEach((l) => {
      if (l.category) counts.set(l.category, (counts.get(l.category) ?? 0) + 1)
    })
    return counts
  }, [lessons])

  const priceRange = useMemo(() => {
    if (lessons.length === 0) return null
    const prices = lessons.map((l) => l.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [lessons])

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
            {!loading && lessons.length > 0 ? (
              <p className="mt-3 text-sm font-bold text-[#595e66]">
                {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                {priceRange ? (
                  <> · from £{priceRange.min.toLocaleString()}{priceRange.max !== priceRange.min ? ` to £${priceRange.max.toLocaleString()}` : ""}</>
                ) : null}
              </p>
            ) : null}
          </div>

          <Link
            href="/creator/academy/new"
            className="inline-flex shrink-0 items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Teach a lesson
          </Link>
        </div>

        {/* Browse by topic */}
        <div className="mt-10">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#595e66]">What can be taught</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <button
              onClick={() => setCategory("All")}
              className={`border-2 p-4 text-left transition-colors ${
                category === "All" ? "border-[#10141b] bg-[#10141b] text-[#f5f3ee]" : "border-[#10141b]/20 bg-white hover:border-[#10141b]"
              }`}
            >
              <p className="font-display text-lg font-extrabold">All topics</p>
              <p className={`mt-1 text-xs leading-5 ${category === "All" ? "text-[#a8adb6]" : "text-[#595e66]"}`}>
                Every lesson published, no filter
              </p>
              <p className={`mt-2 text-xs font-bold ${category === "All" ? "text-[#f5f3ee]" : "text-[#8b8f96]"}`}>{lessons.length} lessons</p>
            </button>
            {CATEGORY_INFO.map((c) => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className={`border-2 p-4 text-left transition-colors ${
                  category === c.name ? "border-[#10141b] bg-[#10141b] text-[#f5f3ee]" : "border-[#10141b]/20 bg-white hover:border-[#10141b]"
                }`}
              >
                <p className="font-display text-lg font-extrabold">
                  <span className="mr-1.5 text-[#1a54f0]">{c.icon}</span>
                  {c.name}
                </p>
                <p className={`mt-1 text-xs leading-5 ${category === c.name ? "text-[#a8adb6]" : "text-[#595e66]"}`}>
                  {c.description}
                </p>
                <p className={`mt-2 text-xs font-bold ${category === c.name ? "text-[#f5f3ee]" : "text-[#8b8f96]"}`}>
                  {categoryCounts.get(c.name) ?? 0} lessons
                </p>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="surface-card h-56 animate-pulse" />
            ))}
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={category === "All" ? "The first lessons are being written" : `Nothing under ${category} yet`}
              body={
                category === "All"
                  ? "Academy is new. If you've landed paid work as a creator, you already know something worth charging for — publish it and keep 90% of every sale."
                  : "No one has published in this topic yet. Pick another topic, or write the one you wish existed."
              }
              action={{ label: "Teach a lesson", href: "/creator/academy/new" }}
              secondary={category === "All" ? undefined : { label: "See all topics →", href: "/academy" }}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLessons.map((lesson, i) => (
              <Reveal key={lesson.id} delay={Math.min(i, 5) * 60} className="h-full">
              <Link
                href={`/academy/${lesson.id}`}
                className="surface-card surface-card-hover flex h-full flex-col overflow-hidden"
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
                <div className="flex items-center gap-2 border-t-2 border-[#10141b]/10 p-5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eae8e1]">
                    {lesson.teacher_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lesson.teacher_avatar} alt={lesson.teacher_name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-[#595e66]">{lesson.teacher_name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-[#8b8f96]">
                    {lesson.teacher_name}{lesson.teacher_niche ? ` · ${lesson.teacher_niche}` : ""}
                  </span>
                </div>
              </Link>
              </Reveal>
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
