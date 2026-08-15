"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import EmptyState from "@/components/empty-state"
import Reveal from "@/components/reveal"
import { supabase } from "@/lib/supabase"

type EventRow = {
  id: string
  title: string
  description: string
  venue: string | null
  city: string
  starts_at: string
  capacity: number | null
  perks: string | null
  brand_id: string
  brand_name: string
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState("All")

  useEffect(() => {
    async function load() {
      const nowIso = new Date().toISOString()

      const { data } = await supabase
        .from("events")
        .select("id,title,description,venue,city,starts_at,capacity,perks,brand_id")
        .eq("status", "published")
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true })

      const list = data ?? []

      if (list.length === 0) {
        setEvents([])
        setLoading(false)
        return
      }

      const brandIds = Array.from(new Set(list.map((e) => e.brand_id)))
      const { data: brands } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", brandIds)

      const nameById = new Map(brands?.map((b) => [b.id, b.display_name ?? "A brand"]))

      setEvents(list.map((e) => ({ ...e, brand_name: nameById.get(e.brand_id) ?? "A brand" })))
      setLoading(false)

      const { data: counts } = await supabase.rpc("event_application_counts", {
        event_ids: list.map((e) => e.id),
      })
      if (counts) {
        setApplicantCounts(
          Object.fromEntries(
            (counts as { event_id: string; application_count: number }[]).map((row) => [
              row.event_id,
              row.application_count,
            ]),
          ),
        )
      }
    }

    load()
  }, [])

  // Cities come from the events actually posted, so the filter never shows a
  // location with nothing behind it.
  const cities = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => e.city))).sort((a, b) => a.localeCompare(b))
    return ["All", ...unique]
  }, [events])

  const filtered = useMemo(() => {
    if (city === "All") return events
    return events.filter((e) => e.city === city)
  }, [events, city])

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-[1400px] px-5 py-16 pb-24 md:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1a54f0]">Events</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
              Get in the room.
            </h1>
            <p className="mt-3 max-w-lg text-[#595e66]">
              Launches, press days, and shoots hosted by UK brands. Apply to attend — no follower minimum.
            </p>
            {!loading && events.length > 0 ? (
              <p className="mt-3 text-sm font-bold text-[#595e66]">
                {events.length} upcoming event{events.length !== 1 ? "s" : ""} across {cities.length - 1} location
                {cities.length - 1 !== 1 ? "s" : ""}
              </p>
            ) : null}
          </div>

          <Link
            href="/brand/events/new"
            className="inline-flex shrink-0 items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Host an event
          </Link>
        </div>

        {/* Location filter */}
        {!loading && cities.length > 1 ? (
          <div className="mt-10">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#595e66]">Filter by location</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`border-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.06em] transition-colors ${
                    city === c
                      ? "border-[#10141b] bg-[#10141b] text-[#f5f3ee]"
                      : "border-[#10141b]/20 bg-white text-[#595e66] hover:border-[#10141b] hover:text-[#10141b]"
                  }`}
                >
                  {c}
                  {c !== "All" ? (
                    <span className="ml-1.5 opacity-70">{events.filter((e) => e.city === c).length}</span>
                  ) : (
                    <span className="ml-1.5 opacity-70">{events.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="surface-card h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title={events.length === 0 ? "No events on the calendar yet" : `Nothing in ${city} just now`}
              body={
                events.length === 0
                  ? "Brand events — launches, press days, shoots — get listed here as they're announced. Creators apply to attend, and there's no follower minimum to get in the room."
                  : "Try another location, or check back — new events go up as brands announce them."
              }
              action={
                events.length === 0
                  ? { label: "Host an event", href: "/brand/events/new" }
                  : { label: "See all locations", href: "/events" }
              }
              secondary={
                events.length === 0
                  ? { label: "Browse paid briefs instead →", href: "/campaigns" }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event, i) => (
              <Reveal key={event.id} delay={Math.min(i, 5) * 60} className="h-full">
              <Link
                href={`/events/${event.id}`}
                className="surface-card surface-card-hover flex h-full flex-col overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 border-b-2 border-[#10141b]/10 p-5">
                  <div>
                    <p className="font-display text-xl font-extrabold text-[#1a54f0]">
                      {formatEventDate(event.starts_at)}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b8f96]">{formatEventTime(event.starts_at)}</p>
                  </div>
                  <span className="shrink-0 bg-[#c8f23c] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#182704]">
                    {event.city}
                  </span>
                </div>

                <div className="flex-1 p-5">
                  <h2 className="font-display text-xl font-extrabold tracking-tight">{event.title}</h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#8b8f96]">{event.brand_name}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#595e66]">{event.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t-2 border-[#10141b]/10 p-5 text-xs font-bold text-[#8b8f96]">
                  {event.capacity ? <span>{event.capacity} spaces</span> : null}
                  {applicantCounts[event.id] ? (
                    <span className="bg-[#10141b] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-[#f5f3ee]">
                      {applicantCounts[event.id]} applied
                    </span>
                  ) : null}
                  {event.venue ? <span className="truncate">{event.venue}</span> : null}
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
            <Link href="/campaigns" className="hover:text-[#f5f3ee]">Campaigns</Link>
            <Link href="/academy" className="hover:text-[#f5f3ee]">Academy</Link>
            <Link href="/how-it-works" className="hover:text-[#f5f3ee]">How it Works</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
