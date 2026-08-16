"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type EventRow = {
  id: string
  title: string
  city: string
  starts_at: string
  capacity: number | null
  status: string
  applicantCount: number
}

const STATUS_STYLE: Record<string, string> = {
  published: "bg-[#c8f23c] text-[#101a3d]",
  draft: "bg-[#0d1117]/10 text-[#5b6472]",
  cancelled: "bg-[#ff534b] text-white",
  completed: "bg-[#0d1117] text-[#f1f3f7]",
}

export default function BrandEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventRow[]>([])
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profile?.role !== "brand") {
        router.push(profile?.role === "creator" ? "/creator/dashboard" : "/login")
        return
      }

      const { data } = await supabase
        .from("events")
        .select("id,title,city,starts_at,capacity,status")
        .eq("brand_id", session.user.id)
        .order("starts_at", { ascending: false })

      const list = data ?? []

      if (list.length === 0) {
        setEvents([])
        setLoading(false)
        return
      }

      const { data: applications } = await supabase
        .from("event_applications")
        .select("event_id")
        .in("event_id", list.map((e) => e.id))

      const countByEvent = new Map<string, number>()
      ;(applications ?? []).forEach((a) => {
        countByEvent.set(a.event_id, (countByEvent.get(a.event_id) ?? 0) + 1)
      })

      setEvents(list.map((e) => ({ ...e, applicantCount: countByEvent.get(e.id) ?? 0 })))
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#5b6472]">Loading your events…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#16255c]">Brand Portal</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#0d1117]">Your events</h1>
            <p className="mt-1 text-sm text-[#5b6472]">
              {events.length} event{events.length !== 1 ? "s" : ""} hosted
            </p>
          </div>
          <Link
            href="/brand/events/new"
            className="inline-flex shrink-0 items-center justify-center rounded-[8px] bg-[#16255c] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Host an event
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#0d1117]/[0.14] p-16 text-center">
          <p className="text-[#5b6472]">You haven&apos;t hosted an event yet.</p>
          <Link href="/brand/events/new" className="mt-3 inline-block text-sm font-bold text-[#16255c] hover:underline">
            Host your first event →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/brand/events/${event.id}`}
              className="flex flex-col gap-4 rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6 transition-colors hover:bg-[#e4e7ee]/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold text-[#0d1117]">{event.title}</h2>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[event.status] ?? "bg-[#0d1117]/10 text-[#5b6472]"}`}>
                    {event.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5b6472]">
                  {new Date(event.starts_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" · "}
                  {event.city}
                  {event.capacity ? ` · ${event.capacity} spaces` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-2xl font-extrabold text-[#16255c]">{event.applicantCount}</p>
                <p className="text-xs text-[#8b93a3]">applied</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
