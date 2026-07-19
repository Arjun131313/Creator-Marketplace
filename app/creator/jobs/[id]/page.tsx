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

      console.debug("Supabase session (raw):", session)

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, id")
        .eq("id", session.user.id)
        .single()

      console.debug("Profile fetch result:", { profile, profileError })

      if (profileError || profile?.role !== "creator") {
        console.warn("Unauthorized access to creator page, redirecting", { profile, profileError })
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
        return
      }

      console.debug("Fetching job with params:", { id })

      const { data, error } = await supabase
        .from("jobs")
        .select("id,title,description,budget,deadline,status,created_at,brand_id")
        .eq("id", id)
        .single()

      console.debug("Job query result:", { data, error })

      if (error || !data) {
        console.error("Supabase error loading job:", error)
        console.debug("Job query params:", { id })
        setError("Could not load job details. The job may no longer be open.")
        setLoading(false)
        return
      }

      console.debug("Loaded job:", data)

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

    router.push("/creator/applications")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-lg font-medium">Loading job details…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-24">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 shadow-sm text-rose-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Job details</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{job?.title}</h1>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Status: {job?.status}</p>
            <p>Budget: ${job?.budget.toFixed(2)}</p>
            <p>{job?.deadline ? `Deadline ${new Date(job.deadline).toLocaleDateString()}` : "No deadline"}</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm leading-7 text-slate-700">{job?.description}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Submit your application</h2>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Pitch</span>
              <textarea
                required
                value={pitch}
                onChange={(event) => setPitch(event.target.value)}
                className="mt-2 min-h-[160px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Proposed rate</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting application…" : "Submit application"}
          </button>
        </form>
      </section>
    </div>
  )
}
