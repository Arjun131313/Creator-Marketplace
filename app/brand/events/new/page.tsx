"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const inputClass =
  "mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors placeholder:text-[#8b8f96] focus:border-[#1a54f0]"
const labelClass = "block text-sm font-bold text-[#10141b]"

export default function NewEventPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [city, setCity] = useState("")
  const [venue, setVenue] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [capacity, setCapacity] = useState("")
  const [perks, setPerks] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function validateBrand() {
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
      }
    }

    validateBrand()
  }, [router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    const { error: insertError } = await supabase.from("events").insert({
      brand_id: session.user.id,
      title,
      description,
      city: city.trim(),
      venue: venue.trim() || null,
      starts_at: new Date(startsAt).toISOString(),
      capacity: capacity ? parseInt(capacity, 10) : null,
      perks: perks.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push("/brand/events")
  }

  return (
    <div className="max-w-3xl border-2 border-[#10141b] bg-white p-8">
      <h1 className="font-display text-2xl font-extrabold text-[#10141b]">Host an event</h1>
      <p className="mt-2 text-sm text-[#595e66]">
        Launches, press days, shoots — creators apply to attend and you pick who comes.
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <label className="block">
          <span className={labelClass}>Event title</span>
          <input
            type="text"
            required
            placeholder="e.g. Spring collection press day"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Description</span>
          <textarea
            required
            rows={5}
            placeholder="What's happening, who it's for, what creators should expect on the day…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass + " min-h-[140px]"}
          />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>City</span>
            <input
              type="text"
              required
              placeholder="e.g. Manchester"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-[#8b8f96]">Used for the location filter on the events page.</span>
          </label>
          <label className="block">
            <span className={labelClass}>Venue (optional)</span>
            <input
              type="text"
              placeholder="e.g. The Whitworth"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Date and time</span>
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Spaces (optional)</span>
            <input
              type="number"
              min="1"
              placeholder="e.g. 20"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block">
          <span className={labelClass}>What&apos;s included (optional)</span>
          <textarea
            rows={3}
            placeholder="Travel covered, goody bag, food and drink, professional photos…"
            value={perks}
            onChange={(e) => setPerks(e.target.value)}
            className={inputClass + " min-h-[90px]"}
          />
        </label>

        {error ? (
          <div className="border-2 border-[#ff534b] bg-white px-4 py-3 text-sm text-[#ff534b]">{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Publishing…" : "Publish event"}
        </button>
      </form>
    </div>
  )
}
