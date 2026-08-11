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
        .select("id,title,description,budget,deadline,status,created_at,brand_id")
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

        <div className="mt-8 border-2 border-[#10141b]/10 bg-[#f5f3ee] p-6">
          <p className="text-sm leading-7 text-[#10141b]">{job?.description}</p>
        </div>
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
