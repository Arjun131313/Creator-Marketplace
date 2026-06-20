"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type JobSummary = {
  id: string
  title: string
  status: string
  budget: number
  deadline: string | null
  created_at: string
}

type RecentActivity = {
  id: string
  job_id: string
  status: string
  pitch: string
  created_at: string
}

export default function BrandDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [error, setError] = useState<string | null>(null)

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
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profileError || profile?.role !== "brand") {
        router.push(profile?.role === "creator" ? "/creator/dashboard" : "/login")
        return
      }

      const [{ data: jobData, error: jobError }, { data: applicationData, error: applicationError }] = await Promise.all([
        supabase
          .from("jobs")
          .select("id,title,status,budget,deadline,created_at")
          .eq("brand_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("applications")
          .select("id,job_id,status,pitch,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      if (jobError || applicationError) {
        setError((jobError || applicationError)?.message ?? "Unable to load dashboard data.")
        setLoading(false)
        return
      }

      const brandJobs = jobData ?? []
      const recentApps = (applicationData ?? []).filter((app) =>
        brandJobs.some((job) => job.id === app.job_id),
      )

      setJobs(brandJobs)
      setActivities(recentApps)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-lg font-medium">Loading your brand dashboard…</p>
        </div>
      </div>
    )
  }

  const activeJobs = jobs.filter((job) => job.status === "open").length
  const recentlyPosted = jobs.slice(0, 3)
  const recentActivity = activities.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Brand dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Your current activity</h2>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/brand/jobs/new"
          >
            Post a new job
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Active jobs</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{activeJobs}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Total jobs</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{jobs.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Recent applications</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{recentActivity.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-slate-900">Recent job postings</h3>
            <Link className="text-sm font-medium text-slate-600 hover:text-slate-900" href="/brand/jobs">
              View all jobs
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {recentlyPosted.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-600">
                No jobs posted yet. Create your first job to get started.
              </div>
            ) : (
              recentlyPosted.map((job) => (
                <div key={job.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{job.status}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>Budget ${job.budget.toFixed(2)}</p>
                      <p>{job.deadline ? new Date(job.deadline).toLocaleDateString() : "No deadline"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Recent activity</h3>
          <div className="mt-6 space-y-4">
            {recentActivity.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-600">
                No recent application activity yet.
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{activity.status}</p>
                      <p className="mt-1 text-sm text-slate-600">{activity.pitch}</p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
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
