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
  open: { label: "Open", style: "bg-[#c8f23c] text-[#182704]" },
  in_progress: { label: "In progress", style: "bg-[#1a54f0] text-white" },
  completed: { label: "Completed", style: "bg-[#10141b] text-[#f5f3ee]" },
  cancelled: { label: "Cancelled", style: "bg-[#ff534b] text-white" },
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
        <p className="text-[#595e66]">Loading jobs…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="border-2 border-[#10141b] bg-white p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1a54f0]">
              Brand Portal
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#10141b]">Your jobs</h1>
            <p className="mt-1 text-sm text-[#595e66]">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} posted
            </p>
          </div>
          <Link
            href="/brand/jobs/new"
            className="inline-flex shrink-0 items-center gap-2 border-2 border-[#10141b] bg-[#1a54f0] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
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
              className={`border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
                filter === f.key
                  ? "border-[#10141b] bg-[#10141b] text-[#f5f3ee]"
                  : "border-[#10141b]/20 text-[#595e66] hover:border-[#10141b]/50 hover:text-[#10141b]"
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
        <div className="border-2 border-[#ff534b] bg-white p-4 text-sm text-[#ff534b]">
          {error}
        </div>
      ) : null}

      {/* Job cards */}
      {filteredJobs.length === 0 ? (
        <div className="border-2 border-dashed border-[#10141b]/20 p-16 text-center">
          <p className="text-[#595e66]">
            {filter === "all" ? "No jobs posted yet." : `No ${filter.replace("_", " ")} jobs.`}
          </p>
          {filter === "all" ? (
            <Link
              href="/brand/jobs/new"
              className="mt-4 inline-block text-sm font-bold text-[#1a54f0] hover:underline"
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
              style: "bg-[#10141b]/10 text-[#595e66]",
            }
            const isOverdue =
              job.deadline && new Date(job.deadline) < new Date() && job.status === "open"

            return (
              <div
                key={job.id}
                className="border-2 border-[#10141b] bg-white p-6 transition-colors hover:bg-[#eae8e1]/40"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-[#10141b]">
                        {job.title}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold uppercase ${cfg.style}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#595e66]">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon />
                        Posted {new Date(job.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {job.deadline ? (
                        <span className={`flex items-center gap-1.5 ${isOverdue ? "text-[#ff534b]" : ""}`}>
                          <CalendarIcon />
                          {isOverdue ? "Overdue · " : "Deadline · "}
                          {new Date(job.deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-[#8b8f96]">No deadline</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="font-display text-2xl font-extrabold text-[#1a54f0]">£{job.budget.toLocaleString()}</p>
                    <p className="text-xs text-[#8b8f96]">budget</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t-2 border-[#10141b]/10 pt-5">
                  <Link
                    href={`/brand/jobs/${job.id}`}
                    className="border-2 border-[#10141b] bg-[#1a54f0] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Job detail
                  </Link>
                  <Link
                    href={`/brand/jobs/${job.id}/applications`}
                    className="border-2 border-[#10141b]/20 px-4 py-2 text-xs font-bold text-[#10141b] transition-colors hover:border-[#10141b]"
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
