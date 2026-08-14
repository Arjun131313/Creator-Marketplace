"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { supabase } from "@/lib/supabase"

type CampaignJob = {
  id: string
  title: string
  description: string
  budget: number
  deadline: string | null
  created_at: string
  content_type: string | null
  platform: string | null
  requires_shipping: boolean
}

type SortKey = "newest" | "highest_fee" | "closing_soon"

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "highest_fee", label: "Highest fee" },
  { key: "closing_soon", label: "Closing soon" },
]

export default function CampaignsPage() {
  const [jobs, setJobs] = useState<CampaignJob[]>([])
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortKey>("newest")

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("jobs")
        .select("id,title,description,budget,deadline,created_at,content_type,platform,requires_shipping")
        .eq("status", "open")
        .order("created_at", { ascending: false })

      const jobsList = data ?? []
      setJobs(jobsList)
      setLoading(false)

      if (jobsList.length > 0) {
        const { data: counts } = await supabase.rpc("job_application_counts", {
          job_ids: jobsList.map((j) => j.id),
        })
        if (counts) {
          setApplicantCounts(
            Object.fromEntries(
              (counts as { job_id: string; application_count: number }[]).map((row) => [
                row.job_id,
                row.application_count,
              ]),
            ),
          )
        }
      }
    }

    load()
  }, [])

  const sortedJobs = useMemo(() => {
    const copy = [...jobs]
    if (sort === "highest_fee") {
      return copy.sort((a, b) => b.budget - a.budget)
    }
    if (sort === "closing_soon") {
      return copy.sort((a, b) => {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    }
    return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [jobs, sort])

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-[1400px] px-5 py-16 pb-24 md:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1a54f0]">
              Live campaigns
            </p>
            <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
              {loading ? "Loading briefs…" : `${jobs.length} brief${jobs.length !== 1 ? "s" : ""}. All paid.`}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`border-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.06em] transition-colors ${
                  sort === s.key
                    ? "border-[#10141b] bg-[#10141b] text-[#f5f3ee]"
                    : "border-[#10141b]/20 text-[#595e66] hover:border-[#10141b]/50 hover:text-[#10141b]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse border-2 border-[#10141b]/10 bg-white" />
            ))}
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="mt-8 border-2 border-dashed border-[#10141b]/20 p-16 text-center">
            <p className="text-[#595e66]">No open briefs right now. Check back soon.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedJobs.map((job) => (
              <article key={job.id} className="flex flex-col border-2 border-[#10141b] bg-white">
                {job.platform || job.content_type ? (
                  <div className="flex flex-wrap gap-1.5 border-b-2 border-[#10141b]/10 p-5 pb-0">
                    {job.platform ? (
                      <span className="bg-[#c8f23c] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#182704]">
                        {job.platform}
                      </span>
                    ) : null}
                    {job.content_type ? (
                      <span className="bg-[#10141b]/10 px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#595e66]">
                        {job.content_type}
                      </span>
                    ) : null}
                    {job.requires_shipping ? (
                      <span className="bg-[#feb930] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#2b1d00]">
                        Ships product
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-b-2 border-[#10141b]/10 p-5">
                  <span className="font-display text-3xl font-extrabold text-[#1a54f0]">
                    £{job.budget.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {applicantCounts[job.id] ? (
                      <span className="bg-[#c8f23c] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#182704]">
                        {applicantCounts[job.id]} applied
                      </span>
                    ) : null}
                    <span className="bg-[#10141b] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#f5f3ee]">
                      {new Date(job.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-5">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight">{job.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#595e66]">{job.description}</p>
                </div>

                <div className="flex items-center justify-between border-t-2 border-[#10141b]/10 p-5">
                  <span className="text-sm text-[#595e66]">
                    {job.deadline
                      ? `Closes ${new Date(job.deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`
                      : "No deadline"}
                  </span>
                  <Link
                    href={`/creator/jobs/${job.id}`}
                    className="border-2 border-[#10141b] bg-[#10141b] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#f5f3ee] transition-opacity hover:opacity-90"
                  >
                    Apply
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#10141b]/10 bg-[#10141b] px-5 py-12 text-[#a8adb6]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f5f3ee]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/creators" className="hover:text-[#f5f3ee]">Browse Creators</Link>
            <Link href="/how-it-works" className="hover:text-[#f5f3ee]">How it Works</Link>
            <Link href="/help" className="hover:text-[#f5f3ee]">Help Center</Link>
            <Link href="/terms" className="hover:text-[#f5f3ee]">Terms</Link>
            <Link href="/privacy" className="hover:text-[#f5f3ee]">Privacy</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
