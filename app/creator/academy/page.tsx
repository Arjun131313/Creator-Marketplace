"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type TaughtLesson = {
  id: string
  title: string
  price: number
  status: string
  sales: number
}

type Purchase = {
  id: string
  lesson_id: string
  lesson_title: string
  amount: number
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  published: "bg-[#c8f23c] text-[#101a3d]",
  draft: "bg-[#0d1117]/10 text-[#5b6472]",
  archived: "bg-[#0d1117]/10 text-[#5b6472]",
}

export default function CreatorAcademyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"teaching" | "purchases">("teaching")
  const [taughtLessons, setTaughtLessons] = useState<TaughtLesson[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const [{ data: lessons }, { data: sales }, { data: purchaseRows }] = await Promise.all([
        supabase
          .from("academy_lessons")
          .select("id,title,price,status")
          .eq("creator_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("academy_purchases")
          .select("lesson_id")
          .eq("teacher_id", session.user.id)
          .eq("status", "paid"),
        supabase
          .from("academy_purchases")
          .select("id,lesson_id,amount,created_at,academy_lessons(title)")
          .eq("buyer_id", session.user.id)
          .eq("status", "paid")
          .order("created_at", { ascending: false }),
      ])

      const salesByLesson = new Map<string, number>()
      ;(sales ?? []).forEach((s) => {
        salesByLesson.set(s.lesson_id, (salesByLesson.get(s.lesson_id) ?? 0) + 1)
      })

      setTaughtLessons(
        (lessons ?? []).map((l) => ({ ...l, sales: salesByLesson.get(l.id) ?? 0 })),
      )

      const purchaseRowsTyped = (purchaseRows ?? []) as unknown as Array<{
        id: string
        lesson_id: string
        amount: number
        created_at: string
        academy_lessons: { title: string } | null
      }>

      setPurchases(
        purchaseRowsTyped.map((p) => ({
          id: p.id,
          lesson_id: p.lesson_id,
          lesson_title: p.academy_lessons?.title ?? "Lesson",
          amount: p.amount,
          created_at: p.created_at,
        })),
      )

      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#5b6472]">Loading Academy…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#0d1117]">Creator Academy</h1>
            <p className="mt-1 text-sm text-[#5b6472]">What you&apos;re teaching and what you&apos;ve bought.</p>
          </div>
          <Link
            href="/creator/academy/new"
            className="inline-flex shrink-0 items-center justify-center rounded-[8px] bg-[#16255c] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Teach a lesson
          </Link>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setTab("teaching")}
            className={`border px-4 py-1.5 text-xs font-bold transition-colors ${
              tab === "teaching" ? "border-[#0d1117] bg-[#0d1117] text-[#f1f3f7]" : "border-[#0d1117]/20 text-[#5b6472]"
            }`}
          >
            Teaching ({taughtLessons.length})
          </button>
          <button
            onClick={() => setTab("purchases")}
            className={`border px-4 py-1.5 text-xs font-bold transition-colors ${
              tab === "purchases" ? "border-[#0d1117] bg-[#0d1117] text-[#f1f3f7]" : "border-[#0d1117]/20 text-[#5b6472]"
            }`}
          >
            Purchases ({purchases.length})
          </button>
        </div>
      </div>

      {tab === "teaching" ? (
        <div className="space-y-4">
          {taughtLessons.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#0d1117]/[0.14] p-8 text-center text-[#5b6472]">
              You haven&apos;t published a lesson yet.
              <Link href="/creator/academy/new" className="mt-2 block text-sm font-bold text-[#16255c] hover:underline">
                Teach your first lesson →
              </Link>
            </div>
          ) : (
            taughtLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/academy/${lesson.id}`}
                className="flex items-center justify-between rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6 transition-colors hover:bg-[#e4e7ee]/40"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-[#0d1117]">{lesson.title}</p>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[lesson.status] ?? "bg-[#0d1117]/10 text-[#5b6472]"}`}>
                      {lesson.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#5b6472]">£{lesson.price.toLocaleString()} · {lesson.sales} sold</p>
                </div>
                <p className="font-display text-lg font-extrabold text-[#16255c]">
                  £{(lesson.price * lesson.sales).toLocaleString()}
                </p>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#0d1117]/[0.14] p-8 text-center text-[#5b6472]">
              You haven&apos;t bought a lesson yet.
              <Link href="/academy" className="mt-2 block text-sm font-bold text-[#16255c] hover:underline">
                Browse the Academy →
              </Link>
            </div>
          ) : (
            purchases.map((purchase) => (
              <Link
                key={purchase.id}
                href={`/academy/${purchase.lesson_id}`}
                className="flex items-center justify-between rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6 transition-colors hover:bg-[#e4e7ee]/40"
              >
                <div>
                  <p className="text-lg font-bold text-[#0d1117]">{purchase.lesson_title}</p>
                  <p className="mt-1 text-sm text-[#8b93a3]">
                    Bought {new Date(purchase.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#16255c]">View content →</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
