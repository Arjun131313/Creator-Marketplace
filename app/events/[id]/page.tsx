"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PublicNav from "@/components/public-nav"
import { supabase } from "@/lib/supabase"

type EventDetail = {
  id: string
  title: string
  description: string
  venue: string | null
  city: string
  starts_at: string
  capacity: number | null
  perks: string | null
  status: string
  brand_id: string
  brand_name: string
}

type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn"

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  accepted: "bg-[#c8f23c] text-[#182704]",
  rejected: "bg-[#ff534b] text-white",
  withdrawn: "bg-[#10141b]/10 text-[#595e66]",
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "Application pending",
  accepted: "You're on the list",
  rejected: "Not selected this time",
  withdrawn: "Application withdrawn",
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [application, setApplication] = useState<{ status: ApplicationStatus } | null>(null)
  const [message, setMessage] = useState("")
  const [applying, setApplying] = useState(false)
  // Captured once on load rather than read during render, so the "past event"
  // state can't flip mid-render.
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: row, error: eventError } = await supabase
        .from("events")
        .select("id,title,description,venue,city,starts_at,capacity,perks,status,brand_id")
        .eq("id", id)
        .single()

      if (eventError || !row) {
        setError("Event not found.")
        setLoading(false)
        return
      }

      const { data: brand } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", row.brand_id)
        .maybeSingle()

      setEvent({ ...row, brand_name: brand?.display_name ?? "A brand" })
      setIsPast(new Date(row.starts_at).getTime() < Date.now())

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.id) {
        setIsHost(row.brand_id === session.user.id)

        const [{ data: profile }, { data: existing }] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle(),
          supabase
            .from("event_applications")
            .select("status")
            .eq("event_id", id)
            .eq("creator_id", session.user.id)
            .maybeSingle(),
        ])

        setRole(profile?.role ?? null)
        if (existing) setApplication({ status: existing.status as ApplicationStatus })
      }

      setLoading(false)
    }

    load()
  }, [id])

  async function handleApply() {
    setApplying(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    const { error: insertError } = await supabase.from("event_applications").insert({
      event_id: id,
      creator_id: session.user.id,
      message: message.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setApplying(false)
      return
    }

    setApplication({ status: "pending" })
    setApplying(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ee]">
        <PublicNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-[#595e66]">Loading event…</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#f5f3ee]">
        <PublicNav />
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="border-2 border-[#ff534b] bg-white p-8 text-[#ff534b]">{error ?? "Event not found."}</div>
        </div>
      </div>
    )
  }

  const startsAt = new Date(event.starts_at)

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <Link href="/events" className="text-sm font-bold text-[#1a54f0] hover:underline">
          ← All events
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="bg-[#c8f23c] px-2.5 py-1 text-[11px] font-bold uppercase text-[#182704]">{event.city}</span>
          {event.status === "cancelled" ? (
            <span className="bg-[#ff534b] px-2.5 py-1 text-[11px] font-bold uppercase text-white">Cancelled</span>
          ) : null}
          {isPast ? (
            <span className="bg-[#10141b]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#595e66]">Past event</span>
          ) : null}
          <span className="text-xs font-bold uppercase tracking-wide text-[#8b8f96]">Hosted by {event.brand_name}</span>
        </div>

        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{event.title}</h1>

        <div className="mt-6 grid gap-px border-2 border-[#10141b] bg-[#10141b]/10 sm:grid-cols-3">
          <div className="bg-white p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8b8f96]">When</p>
            <p className="mt-1 font-display text-lg font-extrabold">
              {startsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="text-sm text-[#595e66]">
              {startsAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="bg-white p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8b8f96]">Where</p>
            <p className="mt-1 font-display text-lg font-extrabold">{event.city}</p>
            {event.venue ? <p className="text-sm text-[#595e66]">{event.venue}</p> : null}
          </div>
          <div className="bg-white p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8b8f96]">Spaces</p>
            <p className="mt-1 font-display text-lg font-extrabold">{event.capacity ?? "—"}</p>
            <p className="text-sm text-[#595e66]">{event.capacity ? "Limited" : "Not specified"}</p>
          </div>
        </div>

        <div className="mt-6 border-2 border-[#10141b]/10 bg-white p-6">
          <p className="whitespace-pre-line text-sm leading-7 text-[#10141b]">{event.description}</p>
        </div>

        {event.perks ? (
          <div className="mt-4 border-2 border-[#c8f23c] bg-[#c8f23c]/15 p-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#182704]">What&apos;s included</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#10141b]">{event.perks}</p>
          </div>
        ) : null}

        {/* Apply */}
        <div className="mt-6 border-2 border-[#10141b] bg-white p-6">
          {isHost ? (
            <>
              <p className="text-sm font-bold text-[#10141b]">This is your event</p>
              <Link
                href={`/brand/events/${event.id}`}
                className="mt-3 inline-flex items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Review applications
              </Link>
            </>
          ) : application ? (
            <>
              <span className={`inline-block px-3 py-1 text-xs font-bold uppercase ${STATUS_STYLE[application.status]}`}>
                {STATUS_LABEL[application.status]}
              </span>
              <p className="mt-3 text-sm text-[#595e66]">
                {application.status === "accepted"
                  ? "The brand will be in touch with the details — keep an eye on your inbox."
                  : application.status === "pending"
                    ? "The brand will review applications and confirm who's attending."
                    : "Have a look at other upcoming events."}
              </p>
            </>
          ) : isPast || event.status !== "published" ? (
            <p className="text-sm text-[#595e66]">Applications are closed for this event.</p>
          ) : role === "brand" ? (
            <p className="text-sm text-[#595e66]">
              You&apos;re signed in as a brand — only creator accounts can apply to attend.
            </p>
          ) : (
            <>
              <p className="text-sm font-bold text-[#10141b]">Apply to attend</p>
              <p className="mt-1 text-sm text-[#595e66]">
                Tell the brand why you&apos;d be a good fit. Optional, but it helps.
              </p>
              <textarea
                rows={3}
                placeholder="A line or two about you and why this event fits your audience…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-3 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors placeholder:text-[#8b8f96] focus:border-[#1a54f0]"
              />
              <button
                onClick={handleApply}
                disabled={applying}
                className="mt-3 inline-flex items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applying ? "Sending…" : "Apply to attend"}
              </button>
              <p className="mt-3 text-xs text-[#8b8f96]">
                Free to apply. No follower minimum — brands pick on fit.
              </p>
            </>
          )}

          {error ? <p className="mt-3 text-sm text-[#ff534b]">{error}</p> : null}
        </div>
      </main>
    </div>
  )
}
