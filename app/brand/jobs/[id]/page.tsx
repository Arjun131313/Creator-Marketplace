"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
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

type AcceptedCreator = {
  applicationId: string
  creatorId: string
  creatorName: string
}

type ExistingReview = {
  id: string
  rating: number
  comment: string
  created_at: string
}

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          className={`text-3xl leading-none transition-transform hover:scale-110 ${
            (hovered || value) >= star ? "text-[#c1440e]" : "text-[#18140f]/20"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg leading-none ${star <= rating ? "text-[#c1440e]" : "text-[#18140f]/20"}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  in_progress: "bg-[#c1440e]/10 text-[#c1440e] border-[#c1440e]/30",
  completed: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  cancelled: "bg-rose-500/10 text-rose-700 border-rose-500/30",
}

export default function BrandJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<JobDetails | null>(null)
  const [acceptedCreators, setAcceptedCreators] = useState<AcceptedCreator[]>([])
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profile?.role !== "brand") {
        router.push(profile?.role === "creator" ? "/creator/dashboard" : "/login")
        return
      }

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("id,title,description,status,budget,deadline,created_at")
        .eq("id", id)
        .eq("brand_id", session.user.id)
        .single()

      if (jobError || !jobData) {
        setError("Job not found or you don't have permission to view it.")
        setLoading(false)
        return
      }

      setJob(jobData)

      // Load accepted applications with creator names
      const { data: applications } = await supabase
        .from("applications")
        .select("id,creator_id,status")
        .eq("job_id", id)
        .eq("status", "accepted")

      const accepted = applications ?? []

      if (accepted.length > 0) {
        const creatorIds = accepted.map((a) => a.creator_id)
        const { data: creators } = await supabase
          .from("profiles")
          .select("id,display_name")
          .in("id", creatorIds)

        const nameById = new Map(creators?.map((c) => [c.id, c.display_name ?? "Creator"]))

        setAcceptedCreators(
          accepted.map((a) => ({
            applicationId: a.id,
            creatorId: a.creator_id,
            creatorName: nameById.get(a.creator_id) ?? "Creator",
          })),
        )
      }

      // Load existing review for this job
      const { data: review } = await supabase
        .from("reviews")
        .select("id,rating,comment,created_at")
        .eq("job_id", id)
        .eq("brand_id", session.user.id)
        .maybeSingle()

      if (review) setExistingReview(review)

      setLoading(false)
    }

    load()
  }, [id, router])

  async function handleSubmitReview(creatorId: string) {
    if (!rating || !comment.trim()) return

    setSubmitting(true)
    setSubmitError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push("/login")
      return
    }

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ creator_id: creatorId, job_id: id, rating, comment }),
    })

    const data = (await response.json()) as { id?: string; error?: string }

    if (!response.ok) {
      setSubmitError(data.error ?? "Failed to submit review. Please try again.")
      setSubmitting(false)
      return
    }

    setExistingReview({
      id: data.id ?? "",
      rating,
      comment,
      created_at: new Date().toISOString(),
    })
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#6b6153]">Loading job details…</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="border border-rose-300 bg-rose-50 p-8 text-rose-700">
        {error ?? "Job not found."}
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[job.status] ?? "bg-[#18140f]/5 text-[#3a332a] border-[#18140f]/20"
  const hasAcceptedCreator = acceptedCreators.length > 0

  return (
    <div className="space-y-8">
      {/* Job header */}
      <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Link
              href="/brand/jobs"
              className="text-sm font-medium text-[#c1440e] transition hover:underline"
            >
              ← Back to jobs
            </Link>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6b6153]">
              Job detail
            </p>
            <h1 className="font-serif text-3xl font-medium text-[#18140f]">{job.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span
              className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}
            >
              {job.status.replace("_", " ")}
            </span>
            <p className="text-sm text-[#6b6153]">
              Budget:{" "}
              <span className="font-semibold text-[#18140f]">£{job.budget.toLocaleString()}</span>
            </p>
            {job.deadline ? (
              <p className="text-sm text-[#6b6153]">
                Deadline:{" "}
                <span className="font-semibold text-[#18140f]">
                  {new Date(job.deadline).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 border border-[#18140f]/10 bg-white/40 p-6">
          <p className="text-sm leading-7 text-[#3a332a]">{job.description}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/brand/jobs/${job.id}/applications`}
            className="inline-flex items-center justify-center rounded-[2px] bg-[#c1440e] px-5 py-2.5 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c]"
          >
            View applications
          </Link>
        </div>
      </section>

      {/* Review section — only shown when there's an accepted creator */}
      {hasAcceptedCreator ? (
        <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
          <h2 className="font-serif text-xl text-[#18140f]">Leave a review</h2>
          <p className="mt-1 text-sm text-[#6b6153]">
            Share your experience working with{" "}
            {acceptedCreators.map((c) => c.creatorName).join(", ")}.
          </p>

          {existingReview ? (
            <div className="mt-6 border border-[#c1440e]/30 bg-[#c1440e]/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#c1440e]">Review submitted</p>
                  <StarDisplay rating={existingReview.rating} />
                </div>
                <p className="shrink-0 text-xs text-[#8b8578]">
                  {new Date(existingReview.created_at).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#3a332a]">{existingReview.comment}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* One review form covers the first accepted creator */}
              {(() => {
                const creator = acceptedCreators[0]
                return (
                  <div className="space-y-5">
                    {acceptedCreators.length > 1 ? (
                      <p className="text-sm font-medium text-[#3a332a]">
                        Reviewing:{" "}
                        <span className="text-[#18140f]">{creator.creatorName}</span>
                      </p>
                    ) : null}

                    <div>
                      <p className="mb-3 text-sm font-medium text-[#3a332a]">Rating *</p>
                      <StarPicker value={rating} onChange={setRating} />
                      {rating > 0 ? (
                        <p className="mt-2 text-xs text-[#8b8578]">
                          {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="review-comment"
                        className="mb-2 block text-sm font-medium text-[#3a332a]"
                      >
                        Comment *
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe your experience working with this creator…"
                        className="w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition placeholder:text-[#8b8578] focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
                      />
                    </div>

                    {submitError ? (
                      <div className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {submitError}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleSubmitReview(creator.creatorId)}
                      disabled={submitting || !rating || !comment.trim()}
                      className="inline-flex items-center justify-center rounded-[2px] bg-[#c1440e] px-6 py-3 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Submit review"}
                    </button>
                  </div>
                )
              })()}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
