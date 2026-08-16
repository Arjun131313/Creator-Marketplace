"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type JobRow = {
  id: string
  title: string
  status: string
  budget: number
  deadline: string | null
  created_at: string
}

type ApplicationRow = {
  id: string
  job_id: string
  status: string
  creator_id: string
  created_at: string
  creatorName?: string
}

const JOB_STATUS_STYLE: Record<string, string> = {
  open: "bg-[#c8f23c] text-[#101a3d]",
  in_progress: "bg-[#16255c] text-white",
  completed: "bg-[#0d1117] text-[#f1f3f7]",
  cancelled: "bg-[#ff534b] text-white",
}

const APP_STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  accepted: "bg-[#c8f23c] text-[#101a3d]",
  rejected: "bg-[#ff534b] text-white",
}

export default function BrandDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,display_name")
        .eq("id", session.user.id)
        .single()

      if (profileError || profile?.role !== "brand") {
        router.push(profile?.role === "creator" ? "/creator/dashboard" : "/login")
        return
      }

      setDisplayName(profile.display_name)

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("id,title,status,budget,deadline,created_at")
        .eq("brand_id", session.user.id)
        .order("created_at", { ascending: false })

      if (jobError) {
        setError(jobError.message)
        setLoading(false)
        return
      }

      const jobsList = jobData ?? []
      setJobs(jobsList)

      const jobIds = jobsList.map((j) => j.id)
      if (jobIds.length > 0) {
        const { data: appData } = await supabase
          .from("applications")
          .select("id,job_id,status,creator_id,created_at")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false })
          .limit(5)

        const appList = appData ?? []

        const creatorIds = Array.from(new Set(appList.map((a) => a.creator_id)))
        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id,display_name")
            .in("id", creatorIds)
          const nameById = new Map(profiles?.map((p) => [p.id, p.display_name ?? "Creator"]))
          setApplications(
            appList.map((a) => ({ ...a, creatorName: nameById.get(a.creator_id) ?? "Creator" })),
          )
        } else {
          setApplications(appList)
        }
      }

      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#5b6472]">Loading dashboard…</p>
      </div>
    )
  }

  const activeJobs = jobs.filter((j) => j.status === "open").length
  const totalApplications = applications.length
  const budgetPosted = jobs.reduce((sum, j) => sum + j.budget, 0)
  const recentJobs = jobs.slice(0, 4)
  const firstName = displayName ? displayName.split(" ")[0] : null

  return (
    <div className="space-y-8">
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-[11vw] font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            Morning{firstName ? `, ${firstName}` : ""}.
          </h1>
          <Link
            href="/brand/jobs/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-[8px] bg-[#16255c] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Post a brief
          </Link>
        </div>
        <p className="mt-2 text-[#5b6472]">Here&apos;s what&apos;s happening with your campaigns.</p>
      </section>

      {/* ── Stat chips ────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[8px] bg-[#c8f23c] p-5">
          <p className="font-display text-3xl font-extrabold text-[#101a3d]">{activeJobs}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#101a3d]/70">Live campaigns</p>
        </div>
        <div className="border border-[#0d1117]/[0.12] bg-[#feb930] p-5">
          <p className="font-display text-3xl font-extrabold text-[#2b1d00]">{totalApplications}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#2b1d00]/70">Applicants to review</p>
        </div>
        <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-5">
          <p className="font-display text-3xl font-extrabold">£{budgetPosted.toLocaleString()}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#5b6472]">Committed budget</p>
        </div>
        <div className="rounded-[8px] bg-[#0d1117] p-5">
          <p className="font-display text-3xl font-extrabold text-[#f1f3f7]">{jobs.length}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#8891a3]">Total briefs posted</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* ── Live campaigns ───────────────────────────────────────────────── */}
        <section className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold">Live campaigns</h2>
            <Link href="/brand/jobs" className="text-sm font-bold text-[#16255c] hover:underline">
              View all →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#0d1117]/10 border-t border-[#0d1117]/10">
            {recentJobs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#5b6472]">No jobs yet.</p>
                <Link href="/brand/jobs/new" className="mt-3 inline-block text-sm font-bold text-[#16255c] hover:underline">
                  Post your first brief →
                </Link>
              </div>
            ) : (
              recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/brand/jobs/${job.id}`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-[#e4e7ee]/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-bold">{job.title}</p>
                      <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase ${JOB_STATUS_STYLE[job.status] ?? "bg-[#0d1117]/10 text-[#5b6472]"}`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5b6472]">
                      {job.deadline
                        ? `Deadline ${new Date(job.deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`
                        : "No deadline"}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-lg font-extrabold text-[#16255c]">£{job.budget.toLocaleString()}</p>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* ── Applicants to review ─────────────────────────────────────────── */}
        <section className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6">
          <h2 className="font-display text-xl font-extrabold">Applicants to review</h2>

          <div className="mt-4 divide-y divide-[#0d1117]/10 border-t border-[#0d1117]/10">
            {applications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#5b6472]">No applications yet.</p>
              </div>
            ) : (
              applications.map((app) => {
                const matchingJob = jobs.find((j) => j.id === app.job_id)
                return (
                  <div key={app.id} className="flex items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{app.creatorName ?? "Creator"}</p>
                      <p className="mt-0.5 truncate text-xs text-[#5b6472]">{matchingJob?.title ?? "Job"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${APP_STATUS_STYLE[app.status] ?? "bg-[#0d1117]/10 text-[#5b6472]"}`}>
                        {app.status}
                      </span>
                      <p className="text-xs text-[#8b93a3]">
                        {new Date(app.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {applications.length > 0 ? (
            <Link
              href="/brand/jobs"
              className="mt-6 flex items-center justify-center border border-[#0d1117]/[0.12] py-3 text-sm font-bold transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
            >
              Manage all jobs
            </Link>
          ) : null}
        </section>
      </div>

      {error ? (
        <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 p-4 text-sm text-[#ff534b]">
          {error}
        </div>
      ) : null}
    </div>
  )
}
