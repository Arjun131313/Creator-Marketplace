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

    router.push("/creator/applications")
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#6b6153]">Loading job details…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-rose-300 bg-rose-50 p-10 text-rose-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">Job details</p>
            <h1 className="mt-2 font-serif text-3xl font-medium text-[#18140f]">{job?.title}</h1>
          </div>
          <div className="text-right text-sm text-[#6b6153]">
            <p>Status: {job?.status}</p>
            <p>Budget: £{job?.budget.toFixed(2)}</p>
            <p>{job?.deadline ? `Deadline ${new Date(job.deadline).toLocaleDateString("en-GB")}` : "No deadline"}</p>
          </div>
        </div>

        <div className="mt-8 border border-[#18140f]/10 bg-white/40 p-6">
          <p className="text-sm leading-7 text-[#3a332a]">{job?.description}</p>
        </div>
      </section>

      <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
        <h2 className="font-serif text-xl text-[#18140f]">Submit your application</h2>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-[#3a332a]">Pitch</span>
              <textarea
                required
                value={pitch}
                onChange={(event) => setPitch(event.target.value)}
                className="mt-2 min-h-[160px] w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#3a332a]">Proposed rate (GBP)</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6b6153]">£</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  className="mt-2 w-full rounded-sm border border-[#18140f]/15 bg-white py-3 pl-8 pr-4 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
                />
              </div>
            </label>
          </div>

          {error ? (
            <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-[2px] bg-[#c1440e] px-6 py-3 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting application…" : "Submit application"}
          </button>
        </form>
      </section>
    </div>
  )
}
