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
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  accepted: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  rejected: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  withdrawn: "bg-[#18140f]/5 text-[#3a332a] border-[#18140f]/20",
}

function SendIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "accent",
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: "accent" | "emerald" | "amber"
}) {
  const iconBg =
    color === "emerald"
      ? "bg-emerald-500/10 text-emerald-700"
      : color === "amber"
        ? "bg-amber-500/10 text-amber-700"
        : "bg-[#c1440e]/10 text-[#c1440e]"

  return (
    <div className="border border-[#18140f]/10 bg-[#fbf9f4] p-6 transition hover:border-[#18140f]/20">
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-[2px] ${iconBg}`}>
        {icon}
      </div>
      <p className="mt-5 font-serif text-3xl text-[#18140f]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[#3a332a]">{label}</p>
      {sub ? <p className="mt-0.5 text-xs text-[#6b6153]">{sub}</p> : null}
    </div>
  )
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

      // Fetch job titles for applications
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
        <p className="text-[#6b6153]">Loading dashboard…</p>
      </div>
    )
  }

  const jobsWon = applications.filter((a) => a.status === "accepted").length
  const pending = applications.filter((a) => a.status === "pending").length

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  })()

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">Creator Portal</p>
            <h1 className="mt-2 font-serif text-3xl font-medium text-[#18140f]">
              {greeting}{displayName ? `, ${displayName}` : ""}.
            </h1>
            <p className="mt-2 text-[#6b6153]">Here&apos;s your creator activity at a glance.</p>
          </div>
          <Link
            href="/creator/jobs"
            className="inline-flex shrink-0 items-center gap-2 rounded-[2px] bg-[#c1440e] px-5 py-3 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Browse open jobs
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<SendIcon />}
            label="Applications sent"
            value={applications.length}
            sub="total submitted"
            color="accent"
          />
          <StatCard
            icon={<TrophyIcon />}
            label="Jobs won"
            value={jobsWon}
            sub="accepted applications"
            color="emerald"
          />
          <StatCard
            icon={<ClockIcon />}
            label="Awaiting response"
            value={pending}
            sub="pending applications"
            color="amber"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Recent applications */}
        <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-xl text-[#18140f]">Recent applications</h2>
            <Link
              href="/creator/applications"
              className="text-sm font-medium text-[#c1440e] transition hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {applications.length === 0 ? (
              <div className="border border-dashed border-[#18140f]/15 p-8 text-center">
                <p className="text-[#6b6153]">No applications yet.</p>
                <Link
                  href="/creator/jobs"
                  className="mt-3 inline-block text-sm font-medium text-[#c1440e] hover:underline"
                >
                  Browse open jobs →
                </Link>
              </div>
            ) : (
              applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/creator/jobs/${app.job_id}`}
                  className="group flex items-center justify-between gap-4 border border-[#18140f]/10 p-4 transition hover:border-[#c1440e]/40 hover:bg-[#c1440e]/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#18140f] transition group-hover:text-[#c1440e]">
                      {app.jobTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8b8578]">
                      {new Date(app.created_at).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      APP_STATUS_STYLE[app.status] ?? "bg-[#18140f]/5 text-[#3a332a] border-[#18140f]/20"
                    }`}
                  >
                    {app.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Open jobs */}
        <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-xl text-[#18140f]">Open jobs</h2>
            <Link
              href="/creator/jobs"
              className="text-sm font-medium text-[#c1440e] transition hover:underline"
            >
              Browse all →
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {openJobs.length === 0 ? (
              <div className="border border-dashed border-[#18140f]/15 p-8 text-center">
                <p className="text-[#6b6153]">No open jobs right now.</p>
              </div>
            ) : (
              openJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/creator/jobs/${job.id}`}
                  className="group flex items-center justify-between gap-4 border border-[#18140f]/10 p-4 transition hover:border-[#c1440e]/40 hover:bg-[#c1440e]/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#18140f] transition group-hover:text-[#c1440e]">
                      {job.title}
                    </p>
                    {job.deadline ? (
                      <p className="mt-0.5 text-xs text-[#8b8578]">
                        Deadline{" "}
                        {new Date(job.deadline).toLocaleDateString("en-GB", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-serif text-lg text-[#18140f]">
                    £{job.budget.toLocaleString()}
                  </p>
                </Link>
              ))
            )}
          </div>

          <div className="mt-6">
            <Link
              href="/creator/profile/setup"
              className="flex items-center justify-center gap-2 border border-[#c1440e]/30 bg-[#c1440e]/5 py-3 text-sm font-medium text-[#c1440e] transition hover:bg-[#c1440e]/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Edit your profile
            </Link>
          </div>
        </section>
      </div>

      {error ? (
        <div className="border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  )
}
