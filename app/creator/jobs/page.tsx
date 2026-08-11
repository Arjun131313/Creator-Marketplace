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
        .select("id,title,description,budget,deadline,status,created_at")
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
        <p className="text-[#595e66]">Loading open jobs…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-2 border-[#10141b] bg-white p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#10141b]">Browse open jobs</h1>
            <p className="mt-1 text-sm text-[#595e66]">Apply to high-quality briefs from brands.</p>
          </div>
          <Link href="/creator/applications" className="text-sm font-bold text-[#1a54f0] hover:underline">
            View my applications
          </Link>
        </div>
      </div>

      {error ? (
        <div className="border-2 border-[#ff534b] bg-white p-5 text-sm text-[#ff534b]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="border-2 border-dashed border-[#10141b]/20 p-8 text-[#595e66]">
            No open jobs are available right now. Check back later.
          </div>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/creator/jobs/${job.id}`}
              className="block border-2 border-[#10141b] bg-white p-6 transition-colors hover:bg-[#eae8e1]/40"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#10141b]">{job.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#595e66]">{job.description}</p>
                </div>
                <div className="text-right text-sm text-[#8b8f96]">
                  <p className="font-display text-lg font-extrabold text-[#1a54f0]">£{job.budget.toFixed(2)}</p>
                  <p>{job.deadline ? new Date(job.deadline).toLocaleDateString("en-GB") : "No deadline"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#8b8f96]">
                <span className="bg-[#c8f23c] px-2 py-0.5 text-[10px] font-bold uppercase text-[#182704]">{job.status}</span>
                <span>{new Date(job.created_at).toLocaleDateString("en-GB")}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
