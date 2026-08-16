"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type JobCard = {
  id: string
  title: string
  description: string
  budget: number
  deadline: string | null
  status: string
  created_at: string
  content_type: string | null
  platform: string | null
  requires_shipping: boolean
}

export default function CreatorJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      if (profileError || profile?.role !== "creator") {
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
        return
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("id,title,description,budget,deadline,status,created_at,content_type,platform,requires_shipping")
        .eq("status", "open")
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#5b6472]">Loading open jobs…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#0d1117]">Browse open jobs</h1>
            <p className="mt-1 text-sm text-[#5b6472]">Apply to high-quality briefs from brands.</p>
          </div>
          <Link href="/creator/applications" className="text-sm font-bold text-[#16255c] hover:underline">
            View my applications
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 p-5 text-sm text-[#ff534b]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#0d1117]/[0.14] p-8 text-[#5b6472]">
            No open jobs are available right now. Check back later.
          </div>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/creator/jobs/${job.id}`}
              className="block rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6 transition-colors hover:bg-[#e4e7ee]/40"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#0d1117]">{job.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#5b6472]">{job.description}</p>
                </div>
                <div className="text-right text-sm text-[#8b93a3]">
                  <p className="font-display text-lg font-extrabold text-[#16255c]">£{job.budget.toFixed(2)}</p>
                  <p>{job.deadline ? new Date(job.deadline).toLocaleDateString("en-GB") : "No deadline"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#8b93a3]">
                <span className="bg-[#c8f23c] px-2 py-0.5 text-[10px] font-bold uppercase text-[#101a3d]">{job.status}</span>
                {job.content_type ? (
                  <span className="bg-[#0d1117]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5b6472]">{job.content_type}</span>
                ) : null}
                {job.platform ? (
                  <span className="bg-[#0d1117]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5b6472]">{job.platform}</span>
                ) : null}
                {job.requires_shipping ? (
                  <span className="bg-[#feb930] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2b1d00]">Ships product</span>
                ) : null}
                <span>{new Date(job.created_at).toLocaleDateString("en-GB")}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
