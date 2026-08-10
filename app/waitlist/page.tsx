"use client"

import { useState } from "react"
import Link from "next/link"
import PublicNav from "@/components/public-nav"

const PLATFORMS = ["Instagram", "TikTok", "Snapchat", "Other"] as const
const NICHES = [
  "Beauty", "Fashion", "Fitness", "Food", "Travel",
  "Gaming", "Tech", "Lifestyle", "Business", "Other",
] as const

const inputClass =
  "w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] placeholder:text-[#8b8578] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
const labelClass = "block text-sm font-medium text-[#3a332a] mb-2"

export default function CreatorWaitlistPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [platform, setPlatform] = useState<string>("")
  const [handle, setHandle] = useState("")
  const [followers, setFollowers] = useState("")
  const [niche, setNiche] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        platform,
        handle,
        followers,
        niche,
      }),
    })

    const data = (await response.json()) as { error?: string }

    if (!response.ok) {
      setError(data.error ?? "Something went wrong. Please try again.")
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#18140f]">
      <PublicNav />

      <div className="relative h-56 overflow-hidden bg-[#18140f]/5 sm:h-72">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/waitlist-hero.jpg"
          alt="A creator filming content with a smartphone on a gimbal"
          className="h-full w-full object-cover"
        />
      </div>

      <main className="mx-auto max-w-2xl px-6 py-16 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c1440e]">For creators</p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          Join the <em className="not-italic italic">waitlist</em>
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-[#6b6153]">
          RealReach Agency is onboarding its founding cohort of microinfluencers by hand. Pop your details below and we&apos;ll personally reach out when there&apos;s a spot for you — no spam, no obligation.
        </p>

        {submitted ? (
          <div className="mt-10 border border-[#c1440e]/30 bg-[#c1440e]/5 p-8">
            <h2 className="font-serif text-2xl text-[#18140f]">You&apos;re on the list</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b6153]">
              Thanks, {fullName.split(" ")[0] || "there"} — we&apos;ll be in touch personally once there&apos;s a founding spot open. In the meantime, feel free to{" "}
              <Link href="/how-it-works" className="font-semibold text-[#c1440e] hover:underline">
                read how RealReach Agency works
              </Link>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-5 border border-[#18140f]/10 bg-[#fbf9f4] p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Full name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Main platform *</label>
                <select
                  required
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className={inputClass + " cursor-pointer"}
                >
                  <option value="" disabled>Select a platform</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className={inputClass + " cursor-pointer"}
                >
                  <option value="">Select a niche (optional)</option>
                  {NICHES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Handle</label>
                <input
                  type="text"
                  placeholder="@yourusername"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Follower count</label>
                <input
                  type="text"
                  placeholder="e.g. 25,000"
                  value={followers}
                  onChange={(e) => setFollowers(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {error ? (
              <div className="border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-[2px] bg-[#c1440e] px-8 py-4 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Joining…" : "Join the waitlist"}
            </button>

            <p className="text-center text-xs text-[#8b8578]">
              Already ready to go?{" "}
              <Link href="/signup" className="font-semibold text-[#c1440e] hover:underline">
                Create a full account instead
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
