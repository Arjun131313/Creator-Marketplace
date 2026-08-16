"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { notify } from "@/lib/notify-client"

type EventDetail = {
  id: string
  title: string
  description: string
  venue: string | null
  city: string
  starts_at: string
  capacity: number | null
  status: string
}

type ApplicantStatus = "pending" | "accepted" | "rejected" | "withdrawn"

type Applicant = {
  id: string
  creator_id: string
  status: ApplicantStatus
  message: string | null
  created_at: string
  creator_name: string
  creator_niche: string | null
  creator_avatar: string | null
}

const STATUS_STYLE: Record<ApplicantStatus, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  accepted: "bg-[#c8f23c] text-[#101a3d]",
  rejected: "bg-[#ff534b] text-white",
  withdrawn: "bg-[#0d1117]/10 text-[#5b6472]",
}

export default function BrandEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: row, error: eventError } = await supabase
        .from("events")
        .select("id,title,description,venue,city,starts_at,capacity,status")
        .eq("id", id)
        .eq("brand_id", session.user.id)
        .single()

      if (eventError || !row) {
        setError("Event not found, or it doesn't belong to your brand.")
        setLoading(false)
        return
      }

      setEvent(row)

      const { data: applicationRows } = await supabase
        .from("event_applications")
        .select("id,creator_id,status,message,created_at")
        .eq("event_id", id)
        .order("created_at", { ascending: false })

      const list = applicationRows ?? []

      if (list.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,display_name,niche,avatar_url")
          .in("id", list.map((a) => a.creator_id))

        const byId = new Map(
          profiles?.map((p) => [p.id, { name: p.display_name ?? "Creator", niche: p.niche, avatar: p.avatar_url }]),
        )

        setApplicants(
          list.map((a) => {
            const profile = byId.get(a.creator_id)
            return {
              ...a,
              status: a.status as ApplicantStatus,
              creator_name: profile?.name ?? "Creator",
              creator_niche: profile?.niche ?? null,
              creator_avatar: profile?.avatar ?? null,
            }
          }),
        )
      }

      setLoading(false)
    }

    load()
  }, [id, router])

  async function handleDecision(applicationId: string, status: "accepted" | "rejected") {
    setActioningId(applicationId)
    setError(null)

    const { error: updateError } = await supabase
      .from("event_applications")
      .update({ status })
      .eq("id", applicationId)

    if (updateError) {
      setError(updateError.message)
      setActioningId(null)
      return
    }

    notify({ type: "event_decision", applicationId })

    setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)))
    setActioningId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#5b6472]">Loading event…</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 p-8 text-[#ff534b]">{error ?? "Event not found."}</div>
    )
  }

  const acceptedCount = applicants.filter((a) => a.status === "accepted").length
  const pendingCount = applicants.filter((a) => a.status === "pending").length

  return (
    <div className="space-y-8">
      <section className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
        <Link href="/brand/events" className="text-sm font-bold text-[#16255c] hover:underline">
          ← Back to events
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0d1117]">{event.title}</h1>
        <p className="mt-2 text-sm text-[#5b6472]">
          {new Date(event.starts_at).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {" · "}
          {new Date(event.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          {" · "}
          {event.venue ? `${event.venue}, ` : ""}
          {event.city}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-[#0d1117]/[0.12] bg-[#feb930] p-5">
            <p className="font-display text-3xl font-extrabold text-[#2b1d00]">{pendingCount}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#2b1d00]/70">To review</p>
          </div>
          <div className="rounded-[8px] bg-[#c8f23c] p-5">
            <p className="font-display text-3xl font-extrabold text-[#101a3d]">{acceptedCount}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#101a3d]/70">On the list</p>
          </div>
          <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-5">
            <p className="font-display text-3xl font-extrabold">{applicants.length}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#5b6472]">Total applied</p>
          </div>
          <div className="rounded-[8px] bg-[#0d1117] p-5">
            <p className="font-display text-3xl font-extrabold text-[#f1f3f7]">{event.capacity ?? "—"}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#8891a3]">Spaces</p>
          </div>
        </div>

        <Link
          href={`/events/${event.id}`}
          className="mt-6 inline-block text-sm font-bold text-[#16255c] hover:underline"
        >
          View public event page →
        </Link>
      </section>

      <section className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
        <h2 className="font-display text-xl font-extrabold text-[#0d1117]">Applications</h2>

        {error ? (
          <div className="mt-4 rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 px-4 py-3 text-sm text-[#ff534b]">{error}</div>
        ) : null}

        <div className="mt-6 space-y-4">
          {applicants.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#0d1117]/[0.14] p-8 text-center text-[#5b6472]">
              No applications yet.
            </div>
          ) : (
            applicants.map((applicant) => (
              <div key={applicant.id} className="rounded-[12px] bg-[#f7f8fa] p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e4e7ee]">
                      {applicant.creator_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={applicant.creator_avatar} alt={applicant.creator_name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#5b6472]">
                          {applicant.creator_name[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/creators/${applicant.creator_id}`}
                        className="font-bold text-[#0d1117] hover:text-[#16255c] hover:underline"
                      >
                        {applicant.creator_name}
                      </Link>
                      <p className="text-xs text-[#8b93a3]">
                        {applicant.creator_niche ?? "Content creator"} ·{" "}
                        {new Date(applicant.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[applicant.status]}`}>
                    {applicant.status}
                  </span>
                </div>

                {applicant.message ? (
                  <p className="mt-4 text-sm leading-6 text-[#5b6472]">{applicant.message}</p>
                ) : null}

                {applicant.status === "pending" ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      disabled={actioningId === applicant.id}
                      onClick={() => handleDecision(applicant.id, "accepted")}
                      className="inline-flex items-center justify-center rounded-[8px] bg-[#c8f23c] px-4 py-2 text-sm font-bold text-[#101a3d] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Add to list
                    </button>
                    <button
                      disabled={actioningId === applicant.id}
                      onClick={() => handleDecision(applicant.id, "rejected")}
                      className="inline-flex items-center justify-center border border-[#0d1117]/[0.12] px-4 py-2 text-sm font-bold text-[#0d1117] transition-colors hover:border-[#0d1117] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
