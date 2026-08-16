"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const CONTENT_TYPES = ["Photo", "Video", "Story", "Reel / Short", "Other"] as const
const PLATFORMS = ["Instagram", "TikTok", "Snapchat", "Other"] as const

const inputClass =
  "mt-2 w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-4 py-3 text-sm text-[#0d1117] outline-none transition-colors focus:border-[#16255c]"

export default function NewJobPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [contentType, setContentType] = useState<string>("")
  const [platform, setPlatform] = useState<string>("")
  const [videoDuration, setVideoDuration] = useState("")
  const [language, setLanguage] = useState("English (UK)")
  const [talkingPoints, setTalkingPoints] = useState("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [requiresShipping, setRequiresShipping] = useState(false)
  const [loading, setLoading] = useState(false)
  const [drafting, setDrafting] = useState(false)
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profileError || profile?.role !== "brand") {
        router.push(profile?.role === "creator" ? "/creator/dashboard" : "/login")
      }
    }

    validateBrand()
  }, [router])

  async function handleDraftWithAI() {
    if (!title.trim()) {
      setError("Add a job title first — the AI draft uses it as a starting point.")
      return
    }

    setDrafting(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push("/login")
      return
    }

    const response = await fetch("/api/jobs/generate-brief", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title,
        contentType,
        platform,
        videoDuration,
        talkingPoints,
      }),
    })

    const data = (await response.json()) as { description?: string; error?: string }

    if (!response.ok || !data.description) {
      setError(data.error ?? "Couldn't draft a brief right now — try writing it yourself.")
      setDrafting(false)
      return
    }

    setDescription(data.description)
    setDrafting(false)
  }

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

    const budgetValue = Number(budget)

    const { error } = await supabase.from("jobs").insert({
      title,
      description,
      budget: budgetValue,
      currency: "gbp",
      deadline: deadline ? new Date(deadline).toISOString() : null,
      brand_id: session.user.id,
      content_type: contentType || null,
      platform: platform || null,
      video_duration: videoDuration.trim() || null,
      language: language.trim() || null,
      talking_points: talkingPoints.trim() || null,
      requires_shipping: requiresShipping,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/brand/jobs")
  }

  return (
    <div className="max-w-3xl rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
      <h1 className="font-display text-2xl font-extrabold text-[#0d1117]">Post a new job</h1>
      <p className="mt-2 text-sm text-[#5b6472]">Create a job brief for creators to apply.</p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <label className="block">
            <span className="text-sm font-bold text-[#0d1117]">Job title</span>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-[#0d1117]">Content type</span>
              <select
                value={contentType}
                onChange={(event) => setContentType(event.target.value)}
                className={inputClass + " cursor-pointer"}
              >
                <option value="">Select a type (optional)</option>
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#0d1117]">Platform</span>
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className={inputClass + " cursor-pointer"}
              >
                <option value="">Select a platform (optional)</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-[#0d1117]">Video duration</span>
              <input
                type="text"
                placeholder="e.g. 30s — leave blank for photo"
                value={videoDuration}
                onChange={(event) => setVideoDuration(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#0d1117]">Language</span>
              <input
                type="text"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-[#0d1117]">Key talking points (optional)</span>
            <textarea
              rows={3}
              placeholder="Hooks, must-mentions, tone of voice…"
              value={talkingPoints}
              onChange={(event) => setTalkingPoints(event.target.value)}
              className={inputClass + " min-h-[90px]"}
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#0d1117]">Description</span>
              <button
                type="button"
                onClick={handleDraftWithAI}
                disabled={drafting}
                className="text-xs font-bold text-[#16255c] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {drafting ? "Drafting…" : "✨ Draft with AI"}
              </button>
            </div>
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={inputClass + " min-h-[160px]"}
            />
            <p className="mt-1 text-xs text-[#8b93a3]">
              Content usage rights transfer to you automatically once payment is released — no separate contract needed.
            </p>
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-[#0d1117]">Budget (GBP)</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#5b6472]">£</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className={inputClass + " pl-8"}
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#0d1117]">Deadline</span>
              <input
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-[12px] bg-[#f7f8fa] p-4">
            <input
              type="checkbox"
              checked={requiresShipping}
              onChange={(event) => setRequiresShipping(event.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#16255c]"
            />
            <span className="text-sm text-[#0d1117]">
              <span className="font-bold">This is a physical product.</span> I&apos;ll need to ship it to the creator once they&apos;re hired — they&apos;ll be asked for a shipping address.
            </span>
          </label>
        </div>

        {error ? (
          <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 px-4 py-3 text-sm text-[#ff534b]">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-[8px] bg-[#16255c] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Publishing job…" : "Publish job"}
        </button>

        <p className="text-center text-xs text-[#8b93a3]">
          Posting is free. Your plan&apos;s hire allowance only applies once you accept a creator.
        </p>
      </form>
    </div>
  )
}
