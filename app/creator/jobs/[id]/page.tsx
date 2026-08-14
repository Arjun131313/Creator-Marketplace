"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type JobDetail = {
  id: string
  title: string
  description: string
  budget: number
  deadline: string | null
  status: string
  created_at: string
  content_type: string | null
  platform: string | null
  video_duration: string | null
  language: string | null
  talking_points: string | null
  requires_shipping: boolean
}

export default function CreatorJobDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = params instanceof Promise ? use(params) : params
  const router = useRouter()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [pitch, setPitch] = useState("")
  const [rate, setRate] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadJob() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, id")
        .eq("id", session.user.id)
        .single()

      if (profileError || profile?.role !== "creator") {
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
        return
      }

      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,title,description,budget,deadline,status,created_at,brand_id,content_type,platform,video_duration,language,talking_points,requires_shipping",
        )
        .eq("id", id)
        .single()

      if (error || !data) {
        setError("Could not load job details. The job may no longer be open.")
        setLoading(false)
        return
      }

      setJob(data)
      setLoading(false)
    }

    loadJob()
  }, [id, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    const proposedRate = rate ? Number(rate) : null

    const { error } = await supabase.from("applications").insert({
      job_id: id,
      creator_id: session.user.id,
      pitch,
      proposed_rate: proposedRate,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    if (session.access_token) {
      fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: "application", jobId: id }),
      }).catch((err) => console.error("Failed to send application notification:", err))
    }

    router.push("/creator/applications")
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#595e66]">Loading job details…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-2 border-[#ff534b] bg-white p-10 text-[#ff534b]">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="border-2 border-[#10141b] bg-white p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1a54f0]">Job details</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#10141b]">{job?.title}</h1>
          </div>
          <div className="text-right text-sm text-[#595e66]">
            <p>Status: {job?.status}</p>
            <p>Budget: £{job?.budget.toFixed(2)}</p>
            <p>{job?.deadline ? `Deadline ${new Date(job.deadline).toLocaleDateString("en-GB")}` : "No deadline"}</p>
          </div>
        </div>

        {job?.content_type || job?.platform || job?.video_duration || job?.language || job?.requires_shipping ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {job.platform ? (
              <span className="bg-[#c8f23c] px-2.5 py-1 text-[11px] font-bold uppercase text-[#182704]">{job.platform}</span>
            ) : null}
            {job.content_type ? (
              <span className="bg-[#10141b]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#595e66]">{job.content_type}</span>
            ) : null}
            {job.video_duration ? (
              <span className="bg-[#10141b]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#595e66]">{job.video_duration}</span>
            ) : null}
            {job.language ? (
              <span className="bg-[#10141b]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#595e66]">{job.language}</span>
            ) : null}
            {job.requires_shipping ? (
              <span className="bg-[#feb930] px-2.5 py-1 text-[11px] font-bold uppercase text-[#2b1d00]">Ships product</span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 border-2 border-[#10141b]/10 bg-[#f5f3ee] p-6">
          <p className="text-sm leading-7 text-[#10141b]">{job?.description}</p>
        </div>

        {job?.talking_points ? (
          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8b8f96]">Key talking points</p>
            <p className="mt-2 text-sm leading-6 text-[#10141b]">{job.talking_points}</p>
          </div>
        ) : null}
      </section>

      <section className="border-2 border-[#10141b] bg-white p-8">
        <h2 className="font-display text-xl font-extrabold text-[#10141b]">Submit your application</h2>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-[#10141b]">Pitch</span>
              <textarea
                required
                value={pitch}
                onChange={(event) => setPitch(event.target.value)}
                className="mt-2 min-h-[160px] w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#10141b]">Proposed rate (GBP)</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#595e66]">£</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  className="mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] py-3 pl-8 pr-4 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
                />
              </div>
            </label>
          </div>

          {error ? (
            <div className="border-2 border-[#ff534b] bg-white px-4 py-3 text-sm text-[#ff534b]">
              {error}
            </div>
          ) : null}

          <button
            disabled={submitting}
            className="inline-flex w-full items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting application…" : "Submit application"}
          </button>
        </form>
      </section>
    </div>
  )
}
