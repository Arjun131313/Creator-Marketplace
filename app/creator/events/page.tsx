"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn"

type EventApplication = {
  id: string
  event_id: string
  status: ApplicationStatus
  created_at: string
  title: string
  city: string
  venue: string | null
  starts_at: string
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  accepted: "bg-[#c8f23c] text-[#101a3d]",
  rejected: "bg-[#ff534b] text-white",
  withdrawn: "bg-[#0d1117]/10 text-[#5b6472]",
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "Awaiting decision",
  accepted: "You're going",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
}

export default function CreatorEventsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<EventApplication[]>([])
  const [loading, setLoading] = useState(true)
  // Split upcoming/past at load time rather than reading the clock during
  // render, which React treats as impure.
  const [upcoming, setUpcoming] = useState<EventApplication[]>([])
  const [past, setPast] = useState<EventApplication[]>([])

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

      if (profile?.role !== "creator") {
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
        return
      }

      const { data } = await supabase
        .from("event_applications")
        .select("id,event_id,status,created_at,events(title,city,venue,starts_at)")
        .eq("creator_id", session.user.id)
        .order("created_at", { ascending: false })

      const rows = (data ?? []) as unknown as Array<{
        id: string
        event_id: string
        status: string
        created_at: string
        events: { title: string; city: string; venue: string | null; starts_at: string } | null
      }>

      const mapped = rows.map((r) => ({
        id: r.id,
        event_id: r.event_id,
        status: r.status as ApplicationStatus,
        created_at: r.created_at,
        title: r.events?.title ?? "Event",
        city: r.events?.city ?? "—",
        venue: r.events?.venue ?? null,
        starts_at: r.events?.starts_at ?? r.created_at,
      }))

      const now = Date.now()
      setApplications(mapped)
      setUpcoming(mapped.filter((a) => new Date(a.starts_at).getTime() >= now))
      setPast(mapped.filter((a) => new Date(a.starts_at).getTime() < now))
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
            <h1 className="font-display text-2xl font-extrabold text-[#0d1117]">My events</h1>
            <p className="mt-1 text-sm text-[#5b6472]">Brand events you&apos;ve applied to attend.</p>
          </div>
          <Link href="/events" className="text-sm font-bold text-[#16255c] hover:underline">
            Browse upcoming events
          </Link>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#0d1117]/[0.14] p-16 text-center">
          <p className="text-[#5b6472]">You haven&apos;t applied to any events yet.</p>
          <Link href="/events" className="mt-3 inline-block text-sm font-bold text-[#16255c] hover:underline">
            See what&apos;s coming up →
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 ? (
            <section>
              <h2 className="font-display text-lg font-extrabold text-[#0d1117]">Upcoming</h2>
              <div className="mt-4 space-y-4">
                {upcoming.map((a) => (
                  <EventApplicationCard key={a.id} application={a} />
                ))}
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section>
              <h2 className="font-display text-lg font-extrabold text-[#0d1117]">Past</h2>
              <div className="mt-4 space-y-4 opacity-70">
                {past.map((a) => (
                  <EventApplicationCard key={a.id} application={a} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

function EventApplicationCard({ application }: { application: EventApplication }) {
  return (
    <Link
      href={`/events/${application.event_id}`}
      className="flex flex-col gap-3 rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6 transition-colors hover:bg-[#e4e7ee]/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-lg font-bold text-[#0d1117]">{application.title}</p>
        <p className="mt-1 text-sm text-[#5b6472]">
          {new Date(application.starts_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {" · "}
          {application.venue ? `${application.venue}, ` : ""}
          {application.city}
        </p>
      </div>
      <span className={`shrink-0 px-3 py-1 text-xs font-bold uppercase ${STATUS_STYLE[application.status]}`}>
        {STATUS_LABEL[application.status]}
      </span>
    </Link>
  )
}
