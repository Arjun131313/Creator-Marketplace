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
        <p className="text-[#5b6472]">Loading job details…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 p-10 text-[#ff534b]">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#16255c]">Job details</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#0d1117]">{job?.title}</h1>
          </div>
          <div className="text-right text-sm text-[#5b6472]">
            <p>Status: {job?.status}</p>
            <p>Budget: £{job?.budget.toFixed(2)}</p>
            <p>{job?.deadline ? `Deadline ${new Date(job.deadline).toLocaleDateString("en-GB")}` : "No deadline"}</p>
          </div>
        </div>

        {job?.content_type || job?.platform || job?.video_duration || job?.language || job?.requires_shipping ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {job.platform ? (
              <span className="bg-[#c8f23c] px-2.5 py-1 text-[11px] font-bold uppercase text-[#101a3d]">{job.platform}</span>
            ) : null}
            {job.content_type ? (
              <span className="bg-[#0d1117]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#5b6472]">{job.content_type}</span>
            ) : null}
            {job.video_duration ? (
              <span className="bg-[#0d1117]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#5b6472]">{job.video_duration}</span>
            ) : null}
            {job.language ? (
              <span className="bg-[#0d1117]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#5b6472]">{job.language}</span>
            ) : null}
            {job.requires_shipping ? (
              <span className="bg-[#feb930] px-2.5 py-1 text-[11px] font-bold uppercase text-[#2b1d00]">Ships product</span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 rounded-[12px] bg-[#f7f8fa] p-6">
          <p className="text-sm leading-7 text-[#0d1117]">{job?.description}</p>
        </div>

        {job?.talking_points ? (
          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8b93a3]">Key talking points</p>
            <p className="mt-2 text-sm leading-6 text-[#0d1117]">{job.talking_points}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
        <h2 className="font-display text-xl font-extrabold text-[#0d1117]">Submit your application</h2>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-[#0d1117]">Pitch</span>
              <textarea
                required
                value={pitch}
                onChange={(event) => setPitch(event.target.value)}
                className="mt-2 min-h-[160px] w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-4 py-3 text-sm text-[#0d1117] outline-none transition-colors focus:border-[#16255c]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#0d1117]">Proposed rate (GBP)</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#5b6472]">£</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  className="mt-2 w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white py-3 pl-8 pr-4 text-sm text-[#0d1117] outline-none transition-colors focus:border-[#16255c]"
                />
              </div>
            </label>
          </div>

          {error ? (
            <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 px-4 py-3 text-sm text-[#ff534b]">
              {error}
            </div>
          ) : null}

          <button
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-[8px] bg-[#16255c] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting application…" : "Submit application"}
          </button>
        </form>
      </section>
    </div>
  )
}
