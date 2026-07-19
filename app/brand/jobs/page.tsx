"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type JobRow = {
  id: string
  title: string
  status: string
  created_at: string
  deadline: string | null
  budget: number
}

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  open: { label: "Open", style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  in_progress: { label: "In progress", style: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  completed: { label: "Completed", style: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  cancelled: { label: "Cancelled", style: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

export default function BrandJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    async function loadJobs() {
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
        return
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("id,title,status,created_at,deadline,budget")
        .eq("brand_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setJobs(data ?? [])
      }

      setLoading(false)
    }

    loadJobs()
  }, [router])

  const filters = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In progress" },
    { key: "completed", label: "Completed" },
  ]

  const filteredJobs = filter === "all" ? jobs : jobs.filter((j) => j.status === filter)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">Loading jobs…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              Brand Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold text-white">Your jobs</h1>
            <p className="mt-1 text-sm text-slate-400">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} posted
            </p>
          </div>
          <Link
            href="/brand/jobs/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post a new job
          </Link>
        </div>

        {/* Filter pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                filter === f.key
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
              {f.key !== "all" ? (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {jobs.filter((j) => j.status === f.key).length}
                </span>
              ) : (
                <span className="ml-1.5 text-[10px] opacity-70">{jobs.length}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      ) : null}

      {/* Job cards */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/40 p-16 text-center">
          <p className="text-slate-400">
            {filter === "all" ? "No jobs posted yet." : `No ${filter.replace("_", " ")} jobs.`}
          </p>
          {filter === "all" ? (
            <Link
              href="/brand/jobs/new"
              className="mt-4 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              Post your first job →
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status] ?? {
              label: job.status,
              style: "bg-slate-500/15 text-slate-300 border-slate-500/30",
            }
            const isOverdue =
              job.deadline && new Date(job.deadline) < new Date() && job.status === "open"

            return (
              <div
                key={job.id}
                className="group rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl transition hover:border-violet-500/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-white group-hover:text-violet-200 transition">
                        {job.title}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${cfg.style}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon />
                        Posted {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {job.deadline ? (
                        <span className={`flex items-center gap-1.5 ${isOverdue ? "text-rose-400" : ""}`}>
                          <CalendarIcon />
                          {isOverdue ? "Overdue · " : "Deadline · "}
                          {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-slate-600">No deadline</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-2xl font-bold text-white">${job.budget.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">budget</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                  <Link
                    href={`/brand/jobs/${job.id}`}
                    className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
                  >
                    Job detail
                  </Link>
                  <Link
                    href={`/brand/jobs/${job.id}/applications`}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    View applications
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
