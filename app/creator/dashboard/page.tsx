"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type ApplicationSummary = {
  id: string
  job_id: string
  status: string
  title: string
  created_at: string
}

type JobSummary = {
  id: string
  title: string
  status: string
  budget: number
  deadline: string | null
}

export default function CreatorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [openJobs, setOpenJobs] = useState<JobSummary[]>([])
  const [error, setError] = useState<string | null>(null)

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
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profileError || profile?.role !== "creator") {
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
        return
      }

      const [applicationRes, jobRes] = await Promise.all([
        supabase
          .from("applications")
          .select("id,job_id,status,created_at,jobs(title)")
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
        setError((applicationRes.error || jobRes.error)?.message ?? "Unable to load creator dashboard.")
        setLoading(false)
        return
      }

      setApplications(
        (applicationRes.data ?? []).map((item) => ({
          id: item.id,
          job_id: item.job_id,
          status: item.status,
          title: item.job?.title ?? "Job",
          created_at: item.created_at,
        })),
      )

      setOpenJobs(jobRes.data ?? [])
      setLoading(false)
    }

    loadDashboard()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-lg font-medium">Loading your creator dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Creator dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your creator workspace</h1>
          </div>
          <Link
            href="/creator/jobs"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Browse open jobs
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Applications</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{applications.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Open jobs</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{openJobs.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Application status</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">
              {applications.filter((app) => app.status === "pending").length} pending
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Recent applications</h2>
            <Link href="/creator/applications" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {applications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-600">
                No applications yet. Apply to a job to get started.
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{application.title}</p>
                      <p className="mt-1 text-sm text-slate-500">Submitted on {new Date(application.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      {application.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Open jobs</h2>
          <div className="mt-6 space-y-4">
            {openJobs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-600">
                No open jobs found. Check back later.
              </div>
            ) : (
              openJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/creator/jobs/${job.id}`}
                  className="block rounded-3xl border border-slate-200 p-5 transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{job.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>Budget ${job.budget.toFixed(2)}</span>
                    <span>{job.deadline ? `Deadline ${new Date(job.deadline).toLocaleDateString()}` : "No deadline"}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  )
}