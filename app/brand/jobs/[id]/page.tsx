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
  content_type: string | null
  platform: string | null
  video_duration: string | null
  language: string | null
  talking_points: string | null
  requires_shipping: boolean
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
            (hovered || value) >= star ? "text-[#1a54f0]" : "text-[#10141b]/20"
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
          className={`text-lg leading-none ${star <= rating ? "text-[#1a54f0]" : "text-[#10141b]/20"}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-[#c8f23c] text-[#182704]",
  in_progress: "bg-[#1a54f0] text-white",
  completed: "bg-[#10141b] text-[#f5f3ee]",
  cancelled: "bg-[#ff534b] text-white",
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
  const [cancelling, setCancelling] = useState(false)

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
        .select(
          "id,title,description,status,budget,deadline,created_at,content_type,platform,video_duration,language,talking_points,requires_shipping",
        )
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

  async function handleCancelJob() {
    if (!job) return
    if (!window.confirm("Cancel this job? It will stop accepting applications and no longer be visible to creators.")) {
      return
    }

    setCancelling(true)
    const { error: cancelError } = await supabase
      .from("jobs")
      .update({ status: "cancelled" })
      .eq("id", job.id)

    if (cancelError) {
      setError(cancelError.message)
      setCancelling(false)
      return
    }

    setJob((prev) => (prev ? { ...prev, status: "cancelled" } : prev))
    setCancelling(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#595e66]">Loading job details…</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="border-2 border-[#ff534b] bg-white p-8 text-[#ff534b]">
        {error ?? "Job not found."}
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[job.status] ?? "bg-[#10141b]/10 text-[#595e66]"
  const hasAcceptedCreator = acceptedCreators.length > 0

  return (
    <div className="space-y-8">
      {/* Job header */}
      <section className="border-2 border-[#10141b] bg-white p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Link
              href="/brand/jobs"
              className="text-sm font-bold text-[#1a54f0] transition hover:underline"
            >
              ← Back to jobs
            </Link>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#595e66]">
              Job detail
            </p>
            <h1 className="font-display text-3xl font-extrabold text-[#10141b]">{job.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span
              className={`inline-block px-3 py-1 text-xs font-bold uppercase ${statusStyle}`}
            >
              {job.status.replace("_", " ")}
            </span>
            <p className="text-sm text-[#595e66]">
              Budget:{" "}
              <span className="font-bold text-[#10141b]">£{job.budget.toLocaleString()}</span>
            </p>
            {job.deadline ? (
              <p className="text-sm text-[#595e66]">
                Deadline:{" "}
                <span className="font-bold text-[#10141b]">
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

        {job.content_type || job.platform || job.video_duration || job.language || job.requires_shipping ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {job.platform ? (
              <span className="bg-[#c8f23c] px-2.5 py-1 text-[11px] font-bold uppercase text-[#182704]">{job.platform}</span>
            ) : null}
            {job.content_type ? (
              <span className="bg-[#10141b]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#595e66]">{job.content_type}</span>
            ) : null}
            {job.video_duration ? (
              <span className="bg-[#10141b]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#595e66]">{job.video_duration}</span>
            ) : null}
            {job.language ? (
              <span className="bg-[#10141b]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#595e66]">{job.language}</span>
            ) : null}
            {job.requires_shipping ? (
              <span className="bg-[#feb930] px-2.5 py-1 text-[11px] font-bold uppercase text-[#2b1d00]">Ships product</span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 border-2 border-[#10141b]/10 bg-[#f5f3ee] p-6">
          <p className="text-sm leading-7 text-[#10141b]">{job.description}</p>
        </div>

        {job.talking_points ? (
          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8b8f96]">Key talking points</p>
            <p className="mt-2 text-sm leading-6 text-[#10141b]">{job.talking_points}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/brand/jobs/${job.id}/applications`}
            className="inline-flex items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            View applications
          </Link>
          {job.status === "open" && !hasAcceptedCreator ? (
            <button
              type="button"
              onClick={handleCancelJob}
              disabled={cancelling}
              className="inline-flex items-center justify-center border-2 border-[#10141b]/20 px-5 py-2.5 text-sm font-bold text-[#10141b] transition-colors hover:border-[#ff534b] hover:text-[#ff534b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Cancel job"}
            </button>
          ) : null}
        </div>
      </section>

      {/* Review section — only shown when there's an accepted creator */}
      {hasAcceptedCreator ? (
        <section className="border-2 border-[#10141b] bg-white p-8">
          <h2 className="font-display text-xl font-extrabold text-[#10141b]">Leave a review</h2>
          <p className="mt-1 text-sm text-[#595e66]">
            Share your experience working with{" "}
            {acceptedCreators.map((c) => c.creatorName).join(", ")}.
          </p>

          {existingReview ? (
            <div className="mt-6 border-2 border-[#c8f23c] bg-[#c8f23c]/15 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-[#182704]">Review submitted</p>
                  <StarDisplay rating={existingReview.rating} />
                </div>
                <p className="shrink-0 text-xs text-[#8b8f96]">
                  {new Date(existingReview.created_at).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#10141b]">{existingReview.comment}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* One review form covers the first accepted creator */}
              {(() => {
                const creator = acceptedCreators[0]
                return (
                  <div className="space-y-5">
                    {acceptedCreators.length > 1 ? (
                      <p className="text-sm font-bold text-[#10141b]">
                        Reviewing:{" "}
                        <span className="text-[#10141b]">{creator.creatorName}</span>
                      </p>
                    ) : null}

                    <div>
                      <p className="mb-3 text-sm font-bold text-[#10141b]">Rating *</p>
                      <StarPicker value={rating} onChange={setRating} />
                      {rating > 0 ? (
                        <p className="mt-2 text-xs text-[#8b8f96]">
                          {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="review-comment"
                        className="mb-2 block text-sm font-bold text-[#10141b]"
                      >
                        Comment *
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe your experience working with this creator…"
                        className="w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors placeholder:text-[#8b8f96] focus:border-[#1a54f0]"
                      />
                    </div>

                    {submitError ? (
                      <div className="border-2 border-[#ff534b] bg-white px-4 py-3 text-sm text-[#ff534b]">
                        {submitError}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleSubmitReview(creator.creatorId)}
                      disabled={submitting || !rating || !comment.trim()}
                      className="inline-flex items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
