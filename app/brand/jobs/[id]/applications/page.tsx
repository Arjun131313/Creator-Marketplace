"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type JobDetails = {
  id: string
  title: string
  description: string
  status: string
  budget: number
  deadline: string | null
  created_at: string
}

type ApplicationRow = {
  id: string
  creator_id: string
  status: string
  pitch: string
  proposed_rate: number | null
  created_at: string
  creator_name?: string | null
}

export default function JobApplicationsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [job, setJob] = useState<JobDetails | null>(null)
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profileError || profile?.role !== "brand") {
        router.push(profile?.role === "creator" ? "/creator/dashboard" : "/login")
        return
      }

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("id,title,description,status,budget,deadline,created_at")
        .eq("id", params.id)
        .eq("brand_id", session.user.id)
        .single()

      if (jobError || !jobData) {
        setError("Unable to load this job. Check that it belongs to your brand.")
        setLoading(false)
        return
      }

      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .select("id,creator_id,status,pitch,proposed_rate,created_at")
        .eq("job_id", params.id)
        .order("created_at", { ascending: false })

      if (applicationError) {
        setError(applicationError.message)
        setLoading(false)
        return
      }

      const applicationsList = applicationData ?? []

      if (applicationsList.length > 0) {
        const creatorIds = applicationsList.map((item) => item.creator_id)
        const { data: creators } = await supabase
          .from("profiles")
          .select("id,display_name")
          .in("id", creatorIds)

        const creatorsById = new Map(creators?.map((profile) => [profile.id, profile.display_name]))

        setApplications(
          applicationsList.map((item) => ({
            ...item,
            creator_name: creatorsById.get(item.creator_id) ?? "Creator",
          })),
        )
      } else {
        setApplications([])
      }

      setJob(jobData)
      setLoading(false)
    }

    loadJob()
  }, [params.id, router])

  const handleApplicationAction = async (applicationId: string, status: "accepted" | "rejected") => {
    setActionLoading(applicationId)
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId)

    if (error) {
      setError(error.message)
      setActionLoading(null)
      return
    }

    setApplications((current) =>
      current.map((app) => (app.id === applicationId ? { ...app, status } : app)),
    )
    setActionLoading(null)
  }

  const statusSummary = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((item) => item.status === "pending").length,
    accepted: applications.filter((item) => item.status === "accepted").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
  }), [applications])

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Job detail</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{job?.title}</h1>
          </div>
          <div className="space-y-2 text-right text-sm text-slate-500">
            <p>Status: <span className="font-semibold text-slate-900">{job?.status}</span></p>
            <p>Budget: ${job?.budget.toFixed(2)}</p>
            <p>Deadline: {job?.deadline ? new Date(job.deadline).toLocaleDateString() : "None"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">{job?.description}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Applications</h2>
            <p className="text-sm text-slate-500">{statusSummary.total} total</p>
          </div>

          <div className="mt-6 grid gap-4">
            {applications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600">
                No applications have been submitted for this job yet.
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="rounded-3xl border border-slate-200 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{application.creator_name || "Creator"}</p>
                      <p className="mt-1 text-sm text-slate-500">{new Date(application.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{application.status}</span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Pitch</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{application.pitch}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Proposed rate</p>
                      <p className="mt-2 text-sm text-slate-600">{application.proposed_rate ? `$${application.proposed_rate.toFixed(2)}` : "Not specified"}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      disabled={application.status !== "pending" || actionLoading === application.id}
                      onClick={() => handleApplicationAction(application.id, "accepted")}
                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      disabled={application.status !== "pending" || actionLoading === application.id}
                      onClick={() => handleApplicationAction(application.id, "rejected")}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Application summary</h3>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Pending</p>
              <p className="font-semibold text-slate-900">{statusSummary.pending}</p>
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Accepted</p>
              <p className="font-semibold text-slate-900">{statusSummary.accepted}</p>
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Rejected</p>
              <p className="font-semibold text-slate-900">{statusSummary.rejected}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
