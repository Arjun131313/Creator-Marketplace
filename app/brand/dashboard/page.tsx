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
  open: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  in_progress: "bg-[#c1440e]/10 text-[#c1440e] border-[#c1440e]/30",
  completed: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  cancelled: "bg-rose-500/10 text-rose-700 border-rose-500/30",
}

const APP_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  accepted: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  rejected: "bg-rose-500/10 text-rose-700 border-rose-500/30",
}

function BriefcaseIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function CurrencyIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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

        // Fetch creator names
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
        <p className="text-[#6b6153]">Loading dashboard…</p>
      </div>
    )
  }

  const activeJobs = jobs.filter((j) => j.status === "open").length
  const totalApplications = applications.length
  const budgetPosted = jobs.reduce((sum, j) => sum + j.budget, 0)
  const recentJobs = jobs.slice(0, 4)

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
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">Brand Portal</p>
            <h1 className="mt-2 font-serif text-3xl font-medium text-[#18140f]">
              {greeting}{displayName ? `, ${displayName}` : ""}.
            </h1>
            <p className="mt-2 text-[#6b6153]">Here&apos;s what&apos;s happening with your campaigns.</p>
          </div>
          <Link
            href="/brand/jobs/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-[2px] bg-[#c1440e] px-5 py-3 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post a new job
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<BriefcaseIcon />}
            label="Active jobs"
            value={activeJobs}
            sub={`${jobs.length} total posted`}
            color="accent"
          />
          <StatCard
            icon={<UsersIcon />}
            label="Applications received"
            value={totalApplications}
            sub="across all jobs"
            color="emerald"
          />
          <StatCard
            icon={<CurrencyIcon />}
            label="Budget posted"
            value={`£${budgetPosted.toLocaleString()}`}
            sub="total across all jobs"
            color="amber"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Recent jobs */}
        <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-xl text-[#18140f]">Recent jobs</h2>
            <Link
              href="/brand/jobs"
              className="text-sm font-medium text-[#c1440e] transition hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {recentJobs.length === 0 ? (
              <div className="border border-dashed border-[#18140f]/15 p-8 text-center">
                <p className="text-[#6b6153]">No jobs yet.</p>
                <Link
                  href="/brand/jobs/new"
                  className="mt-3 inline-block text-sm font-medium text-[#c1440e] hover:underline"
                >
                  Post your first job →
                </Link>
              </div>
            ) : (
              recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/brand/jobs/${job.id}`}
                  className="group flex items-center justify-between gap-4 border border-[#18140f]/10 p-4 transition hover:border-[#c1440e]/40 hover:bg-[#c1440e]/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-medium text-[#18140f] transition group-hover:text-[#c1440e]">
                        {job.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          JOB_STATUS_STYLE[job.status] ?? "bg-[#18140f]/5 text-[#3a332a] border-[#18140f]/20"
                        }`}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#6b6153]">
                      {job.deadline
                        ? `Deadline ${new Date(job.deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`
                        : "No deadline"}
                    </p>
                  </div>
                  <p className="shrink-0 font-serif text-lg text-[#18140f]">
                    £{job.budget.toLocaleString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent applications */}
        <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
          <h2 className="font-serif text-xl text-[#18140f]">Recent applications</h2>

          <div className="mt-6 space-y-3">
            {applications.length === 0 ? (
              <div className="border border-dashed border-[#18140f]/15 p-8 text-center">
                <p className="text-[#6b6153]">No applications yet.</p>
              </div>
            ) : (
              applications.map((app) => {
                const matchingJob = jobs.find((j) => j.id === app.job_id)
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-3 border border-[#18140f]/10 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#18140f]">{app.creatorName ?? "Creator"}</p>
                      <p className="mt-0.5 truncate text-xs text-[#6b6153]">
                        {matchingJob?.title ?? "Job"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          APP_STATUS_STYLE[app.status] ?? "bg-[#18140f]/5 text-[#3a332a] border-[#18140f]/20"
                        }`}
                      >
                        {app.status}
                      </span>
                      <p className="text-xs text-[#8b8578]">
                        {new Date(app.created_at).toLocaleDateString("en-GB", {
                          month: "short",
                          day: "numeric",
                        })}
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
              className="mt-6 flex items-center justify-center border border-[#18140f]/10 py-3 text-sm font-medium text-[#3a332a] transition hover:border-[#c1440e]/40 hover:text-[#c1440e]"
            >
              Manage all jobs
            </Link>
          ) : null}
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
