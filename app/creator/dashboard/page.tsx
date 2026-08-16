"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type ApplicationRow = {
  id: string
  job_id: string
  status: string
  jobTitle: string
  created_at: string
}

type OpenJobRow = {
  id: string
  title: string
  status: string
  budget: number
  deadline: string | null
}

const APP_STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  accepted: "bg-[#c8f23c] text-[#101a3d]",
  rejected: "bg-[#ff534b] text-white",
  withdrawn: "bg-[#0d1117]/10 text-[#5b6472]",
}

export default function CreatorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [openJobs, setOpenJobs] = useState<OpenJobRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
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

      if (profileError || profile?.role !== "creator") {
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
        return
      }

      setDisplayName(profile.display_name)

      const [applicationRes, jobRes] = await Promise.all([
        supabase
          .from("applications")
          .select("id,job_id,status,created_at")
          .eq("creator_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("jobs")
          .select("id,title,status,budget,deadline")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      if (applicationRes.error || jobRes.error) {
        setError((applicationRes.error || jobRes.error)?.message ?? "Unable to load dashboard.")
        setLoading(false)
        return
      }

      const appList = applicationRes.data ?? []

      const jobIds = Array.from(new Set(appList.map((a) => a.job_id)))
      const titleById = new Map<string, string>()
      if (jobIds.length > 0) {
        const { data: jobTitles } = await supabase
          .from("jobs")
          .select("id,title")
          .in("id", jobIds)
        jobTitles?.forEach((j) => titleById.set(j.id, j.title))
      }

      setApplications(
        appList.map((a) => ({
          id: a.id,
          job_id: a.job_id,
          status: a.status,
          jobTitle: titleById.get(a.job_id) ?? "Job",
          created_at: a.created_at,
        })),
      )

      setOpenJobs(jobRes.data ?? [])
      setLoading(false)
    }

    loadDashboard()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#5b6472]">Loading dashboard…</p>
      </div>
    )
  }

  const jobsWon = applications.filter((a) => a.status === "accepted").length
  const pending = applications.filter((a) => a.status === "pending").length
  const firstName = displayName ? displayName.split(" ")[0] : null

  return (
    <div className="space-y-8">
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-[13vw] font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            Hey{firstName ? ` ${firstName}` : ""} 👋
          </h1>
          <Link
            href="/creator/jobs"
            className="inline-flex shrink-0 items-center gap-2 rounded-[8px] bg-[#16255c] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Find new briefs
          </Link>
        </div>
        <p className="mt-2 text-[#5b6472]">Here&apos;s your creator activity at a glance.</p>
      </section>

      {/* ── Stat chips ────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[8px] bg-[#c8f23c] p-5">
          <p className="font-display text-3xl font-extrabold text-[#101a3d]">{jobsWon}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#101a3d]/70">Jobs won</p>
        </div>
        <div className="border border-[#0d1117]/[0.12] bg-[#feb930] p-5">
          <p className="font-display text-3xl font-extrabold text-[#2b1d00]">{pending}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#2b1d00]/70">Awaiting response</p>
        </div>
        <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-5">
          <p className="font-display text-3xl font-extrabold">{applications.length}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#5b6472]">Applications sent</p>
        </div>
        <div className="rounded-[8px] bg-[#0d1117] p-5">
          <p className="font-display text-3xl font-extrabold text-[#f1f3f7]">{openJobs.length}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#8891a3]">Open briefs live</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* ── Recent applications ─────────────────────────────────────────── */}
        <section className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold">Applications</h2>
            <Link href="/creator/applications" className="text-sm font-bold text-[#16255c] hover:underline">
              View all →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#0d1117]/10 border-t border-[#0d1117]/10">
            {applications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#5b6472]">No applications yet.</p>
                <Link href="/creator/jobs" className="mt-3 inline-block text-sm font-bold text-[#16255c] hover:underline">
                  Browse open jobs →
                </Link>
              </div>
            ) : (
              applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/creator/jobs/${app.job_id}`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-[#e4e7ee]/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{app.jobTitle}</p>
                    <p className="mt-0.5 text-xs text-[#5b6472]">
                      {new Date(app.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase ${APP_STATUS_STYLE[app.status] ?? "bg-[#0d1117]/10 text-[#5b6472]"}`}>
                    {app.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* ── Open jobs ────────────────────────────────────────────────────── */}
        <section className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold">Open briefs</h2>
            <Link href="/creator/jobs" className="text-sm font-bold text-[#16255c] hover:underline">
              Browse all →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#0d1117]/10 border-t border-[#0d1117]/10">
            {openJobs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#5b6472]">No open jobs right now.</p>
              </div>
            ) : (
              openJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/creator/jobs/${job.id}`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-[#e4e7ee]/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{job.title}</p>
                    {job.deadline ? (
                      <p className="mt-0.5 text-xs text-[#5b6472]">
                        Deadline {new Date(job.deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-display text-lg font-extrabold text-[#16255c]">£{job.budget.toLocaleString()}</p>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/creator/profile/setup"
            className="mt-6 flex items-center justify-center gap-2 border border-[#0d1117]/[0.12] py-3 text-sm font-bold transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
          >
            Edit your profile
          </Link>
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
