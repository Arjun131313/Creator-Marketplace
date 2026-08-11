"use client"

import { use, useEffect, useMemo, useState } from "react"
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

type ApplicationRow = {
  id: string
  creator_id: string
  status: string
  pitch: string
  proposed_rate: number | null
  created_at: string
  creator_name?: string | null
}

type PaymentStatus = "pending" | "held" | "released" | "refunded" | "disputed"

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  held: "bg-[#1a54f0] text-white",
  released: "bg-[#c8f23c] text-[#182704]",
  refunded: "bg-[#10141b]/10 text-[#595e66]",
  disputed: "bg-[#ff534b] text-white",
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "Payment initiated",
  held: "Payment held in escrow",
  released: "Paid",
  refunded: "Refunded",
  disputed: "Disputed",
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  accepted: "bg-[#c8f23c] text-[#182704]",
  rejected: "bg-[#ff534b] text-white",
  withdrawn: "bg-[#10141b]/10 text-[#595e66]",
}

type SubmissionStatus = "pending" | "approved" | "rejected" | "revision_requested"

type Submission = {
  id: string
  content_url: string
  notes: string | null
  status: SubmissionStatus
  reviewer_notes: string | null
}

const SUBMISSION_BADGE: Record<SubmissionStatus, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  approved: "bg-[#c8f23c] text-[#182704]",
  rejected: "bg-[#ff534b] text-white",
  revision_requested: "bg-[#1a54f0] text-white",
}

const SUBMISSION_LABEL: Record<SubmissionStatus, string> = {
  pending: "Awaiting your review",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Revision requested",
}

export default function JobApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params)
  const router = useRouter()
  const [job, setJob] = useState<JobDetails | null>(null)
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [paymentsByApplication, setPaymentsByApplication] = useState<Record<string, PaymentStatus>>({})
  const [submissionsByApplication, setSubmissionsByApplication] = useState<Record<string, Submission>>({})
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [payingId, setPayingId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
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
        .eq("id", jobId)
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
        .eq("job_id", jobId)
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

        const applicationIds = applicationsList.map((item) => item.id)

        const [{ data: paymentRows }, { data: submissionRows }] = await Promise.all([
          supabase.from("payments").select("application_id,status").in("application_id", applicationIds),
          supabase
            .from("submissions")
            .select("id,application_id,content_url,notes,status,reviewer_notes")
            .in("application_id", applicationIds),
        ])

        setPaymentsByApplication(
          Object.fromEntries(
            (paymentRows ?? []).map((row) => [row.application_id, row.status as PaymentStatus]),
          ),
        )

        setSubmissionsByApplication(
          Object.fromEntries(
            (submissionRows ?? []).map((row) => [
              row.application_id,
              {
                id: row.id,
                content_url: row.content_url,
                notes: row.notes,
                status: row.status as SubmissionStatus,
                reviewer_notes: row.reviewer_notes,
              },
            ]),
          ),
        )
      } else {
        setApplications([])
      }

      setJob(jobData)
      setLoading(false)
    }

    loadJob()
  }, [jobId, router])

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

  const handlePay = async (applicationId: string) => {
    setPayingId(applicationId)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push("/login")
      return
    }

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ applicationId }),
    })

    const data = (await response.json()) as { url?: string; error?: string }

    if (!response.ok || !data.url) {
      setError(data.error ?? "Failed to start payment")
      setPayingId(null)
      return
    }

    window.location.href = data.url
  }

  const handleReview = async (applicationId: string, action: SubmissionStatus) => {
    const submission = submissionsByApplication[applicationId]
    if (!submission) return

    setReviewingId(applicationId)
    setError(null)

    const notes = reviewNotes[applicationId]?.trim() || null

    const { error: updateError } = await supabase
      .from("submissions")
      .update({ status: action, reviewer_notes: notes })
      .eq("id", submission.id)

    if (updateError) {
      setError(updateError.message)
      setReviewingId(null)
      return
    }

    setSubmissionsByApplication((prev) => ({
      ...prev,
      [applicationId]: { ...submission, status: action, reviewer_notes: notes },
    }))

    // Approving releases escrowed funds; rejecting cancels the hold without
    // charging the brand. Revision requests leave the payment untouched.
    if (action === "approved" || action === "rejected") {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        const response = await fetch(`/api/payments/${action === "approved" ? "capture" : "cancel"}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ applicationId }),
        })

        if (response.ok) {
          // Optimistic — the webhook is the source of truth and will confirm
          // this shortly after Stripe processes the capture/cancel.
          setPaymentsByApplication((prev) => ({
            ...prev,
            [applicationId]: action === "approved" ? "released" : "refunded",
          }))
        } else {
          const data = (await response.json()) as { error?: string }
          setError(data.error ?? `Submission ${action}, but the payment action failed`)
        }
      }
    }

    setReviewingId(null)
  }

  const statusSummary = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((item) => item.status === "pending").length,
      accepted: applications.filter((item) => item.status === "accepted").length,
      rejected: applications.filter((item) => item.status === "rejected").length,
    }),
    [applications],
  )

  const hasAccepted = statusSummary.accepted > 0

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#595e66]">Loading applications…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-2 border-[#ff534b] bg-white p-8 text-[#ff534b]">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Job header */}
      <section className="border-2 border-[#10141b] bg-white p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/brand/jobs"
              className="text-sm font-bold text-[#1a54f0] transition hover:underline"
            >
              ← Back to jobs
            </Link>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#595e66]">
              Applications
            </p>
            <h1 className="font-display text-3xl font-extrabold text-[#10141b]">{job?.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-[#595e66]">
            <p>
              Status:{" "}
              <span className="font-bold text-[#10141b]">{job?.status?.replace("_", " ")}</span>
            </p>
            <p>
              Budget:{" "}
              <span className="font-bold text-[#10141b]">£{job?.budget.toLocaleString()}</span>
            </p>
            {job?.deadline ? (
              <p>
                Deadline:{" "}
                <span className="font-bold text-[#10141b]">
                  {new Date(job.deadline).toLocaleDateString("en-GB")}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Review CTA */}
        {hasAccepted ? (
          <div className="mt-6 flex items-center gap-4 border-2 border-[#c8f23c] bg-[#c8f23c]/15 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-[#182704]">Ready to leave a review?</p>
              <p className="mt-0.5 text-xs text-[#595e66]">
                You have accepted creators on this job. Share your experience to help the community.
              </p>
            </div>
            <Link
              href={`/brand/jobs/${jobId}`}
              className="inline-flex shrink-0 items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              Leave a review
            </Link>
          </div>
        ) : null}
      </section>

      {/* Applications + summary */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="border-2 border-[#10141b] bg-white p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold text-[#10141b]">Applications</h2>
            <p className="text-sm text-[#595e66]">{statusSummary.total} total</p>
          </div>

          <div className="mt-6 space-y-4">
            {applications.length === 0 ? (
              <div className="border-2 border-dashed border-[#10141b]/20 p-8 text-center text-[#595e66]">
                No applications yet for this job.
              </div>
            ) : (
              applications.map((application) => (
                <div
                  key={application.id}
                  className="border-2 border-[#10141b]/10 bg-[#f5f3ee] p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-[#10141b]">
                        {application.creator_name || "Creator"}
                      </p>
                      <p className="mt-1 text-sm text-[#8b8f96]">
                        {new Date(application.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold uppercase ${
                        STATUS_BADGE[application.status] ?? "bg-[#10141b]/10 text-[#595e66]"
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8b8f96]">
                        Pitch
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#10141b]">{application.pitch}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8b8f96]">
                        Proposed rate
                      </p>
                      <p className="mt-2 text-sm text-[#10141b]">
                        {application.proposed_rate
                          ? `£${application.proposed_rate.toLocaleString()}`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  {application.status === "pending" ? (
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        disabled={actionLoading === application.id}
                        onClick={() => handleApplicationAction(application.id, "accepted")}
                        className="inline-flex items-center justify-center border-2 border-[#10141b] bg-[#c8f23c] px-4 py-2 text-sm font-bold text-[#182704] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Accept
                      </button>
                      <button
                        disabled={actionLoading === application.id}
                        onClick={() => handleApplicationAction(application.id, "rejected")}
                        className="inline-flex items-center justify-center border-2 border-[#10141b]/20 px-4 py-2 text-sm font-bold text-[#10141b] transition-colors hover:border-[#10141b] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}

                  {application.status === "accepted" ? (
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {paymentsByApplication[application.id] ? (
                        <span
                          className={`inline-block px-3 py-1 text-xs font-bold uppercase ${
                            PAYMENT_BADGE[paymentsByApplication[application.id]]
                          }`}
                        >
                          {PAYMENT_LABEL[paymentsByApplication[application.id]]}
                        </span>
                      ) : (
                        <button
                          disabled={payingId === application.id}
                          onClick={() => handlePay(application.id)}
                          className="inline-flex items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {payingId === application.id ? "Redirecting to payment…" : "Pay & hire"}
                        </button>
                      )}
                    </div>
                  ) : null}

                  {application.status === "accepted" && submissionsByApplication[application.id] ? (
                    <div className="mt-5 border-2 border-[#10141b]/10 bg-white p-5">
                      {(() => {
                        const submission = submissionsByApplication[application.id]
                        return (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-bold text-[#10141b]">Submitted content</p>
                              <span
                                className={`inline-block px-3 py-1 text-xs font-bold uppercase ${SUBMISSION_BADGE[submission.status]}`}
                              >
                                {SUBMISSION_LABEL[submission.status]}
                              </span>
                            </div>
                            <a
                              href={submission.content_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-sm text-[#1a54f0] underline"
                            >
                              View submitted content
                            </a>
                            {submission.notes ? (
                              <p className="mt-2 text-sm text-[#595e66]">
                                <span className="font-bold text-[#10141b]">Creator notes: </span>
                                {submission.notes}
                              </p>
                            ) : null}

                            {submission.status === "pending" ? (
                              <div className="mt-4 space-y-3">
                                <textarea
                                  rows={2}
                                  placeholder="Feedback for the creator (shown to them, required for reject/revision)"
                                  value={reviewNotes[application.id] ?? ""}
                                  onChange={(event) =>
                                    setReviewNotes((prev) => ({ ...prev, [application.id]: event.target.value }))
                                  }
                                  className="w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-2.5 text-sm text-[#10141b] outline-none placeholder:text-[#8b8f96] focus:border-[#1a54f0]"
                                />
                                <div className="flex flex-wrap gap-3">
                                  <button
                                    disabled={reviewingId === application.id}
                                    onClick={() => handleReview(application.id, "approved")}
                                    className="inline-flex items-center justify-center border-2 border-[#10141b] bg-[#c8f23c] px-4 py-2 text-sm font-bold text-[#182704] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Approve &amp; release payment
                                  </button>
                                  <button
                                    disabled={reviewingId === application.id}
                                    onClick={() => handleReview(application.id, "revision_requested")}
                                    className="inline-flex items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Request revision
                                  </button>
                                  <button
                                    disabled={reviewingId === application.id}
                                    onClick={() => handleReview(application.id, "rejected")}
                                    className="inline-flex items-center justify-center border-2 border-[#10141b]/20 px-4 py-2 text-sm font-bold text-[#10141b] transition-colors hover:border-[#10141b] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ) : submission.reviewer_notes ? (
                              <p className="mt-3 text-sm text-[#595e66]">
                                <span className="font-bold text-[#10141b]">Your feedback: </span>
                                {submission.reviewer_notes}
                              </p>
                            ) : null}
                          </>
                        )
                      })()}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border-2 border-[#10141b] bg-white p-8">
          <h3 className="font-display text-xl font-extrabold text-[#10141b]">Summary</h3>
          <div className="mt-6 space-y-3">
            {[
              { label: "Pending", value: statusSummary.pending },
              { label: "Accepted", value: statusSummary.accepted },
              { label: "Rejected", value: statusSummary.rejected },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between border-2 border-[#10141b]/10 px-5 py-4"
              >
                <p className="text-sm text-[#595e66]">{label}</p>
                <p className="font-bold text-[#10141b]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t-2 border-[#10141b]/10 pt-6">
            <Link
              href={`/brand/jobs/${jobId}`}
              className="block w-full border-2 border-[#10141b]/20 px-4 py-3 text-center text-sm font-bold text-[#10141b] transition-colors hover:border-[#10141b]"
            >
              View job detail
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
