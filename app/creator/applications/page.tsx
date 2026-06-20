"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type ApplicationItem = {
  id: string
  job_id: string
  status: string
  pitch: string
  proposed_rate: number | null
  created_at: string
  job_title: string
}

export default function CreatorApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadApplications() {
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

      const { data, error } = await supabase
        .from("applications")
        .select("id,job_id,status,pitch,proposed_rate,created_at,jobs(title)")
        .eq("creator_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setApplications(
          (data ?? []).map((item) => ({
            id: item.id,
            job_id: item.job_id,
            status: item.status,
            pitch: item.pitch,
            proposed_rate: item.proposed_rate,
            created_at: item.created_at,
            job_title: item.job?.title ?? "Job",
          })),
        )
      }

      setLoading(false)
    }

    loadApplications()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-lg font-medium">Loading your applications…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My applications</h1>
            <p className="mt-1 text-sm text-slate-600">Monitor your job applications and status updates.</p>
          </div>
          <Link href="/creator/jobs" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Browse jobs
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-600">
            You have not submitted any applications yet.
          </div>
        ) : (
          applications.map((application) => (
            <div key={application.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{application.job_title}</p>
                  <p className="mt-1 text-sm text-slate-500">Submitted {new Date(application.created_at).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{application.status}</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Pitch</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{application.pitch}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Proposed rate</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {application.proposed_rate ? `$${application.proposed_rate.toFixed(2)}` : "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
