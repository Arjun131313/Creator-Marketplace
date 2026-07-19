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

type SubmissionStatus = "pending" | "approved" | "rejected" | "revision_requested"

type Submission = {
  id: string
  content_url: string
  notes: string | null
  status: SubmissionStatus
  reviewer_notes: string | null
}

const SUBMISSION_BADGE: Record<SubmissionStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  revision_requested: "bg-sky-100 text-sky-800",
}

const SUBMISSION_LABEL: Record<SubmissionStatus, string> = {
  pending: "Submitted — awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Revision requested",
}

export default function CreatorApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [submissionsByApplication, setSubmissionsByApplication] = useState<Record<string, Submission>>({})
  const [formState, setFormState] = useState<Record<string, { content_url: string; notes: string }>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)
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
        setLoading(false)
        return
      }

      const rows = (data ?? []) as unknown as Array<{
        id: string
        job_id: string
        status: string
        pitch: string
        proposed_rate: number | null
        created_at: string
        jobs: { title: string } | null
      }>

      const applicationItems = rows.map((item) => ({
        id: item.id,
        job_id: item.job_id,
        status: item.status,
        pitch: item.pitch,
        proposed_rate: item.proposed_rate,
        created_at: item.created_at,
        job_title: item.jobs?.title ?? "Job",
      }))

      setApplications(applicationItems)

      const acceptedIds = applicationItems
        .filter((item) => item.status === "accepted")
        .map((item) => item.id)

      if (acceptedIds.length > 0) {
        const { data: submissionRows } = await supabase
          .from("submissions")
          .select("id,application_id,content_url,notes,status,reviewer_notes")
          .in("application_id", acceptedIds)

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
      }

      setLoading(false)
    }

    loadApplications()
  }, [router])

  async function handleSubmitWork(application: ApplicationItem) {
    const form = formState[application.id]
    const contentUrl = form?.content_url?.trim()

    if (!contentUrl) {
      setError("Add a link to your content before submitting.")
      return
    }

    setSubmittingId(application.id)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    const existing = submissionsByApplication[application.id]
    const trimmedNotes = form?.notes?.trim() || null

    const { data: savedRow, error: submitError } = existing
      ? await supabase
          .from("submissions")
          .update({
            content_url: contentUrl,
            notes: trimmedNotes,
            status: "pending",
            reviewer_notes: null,
          })
          .eq("id", existing.id)
          .select("id")
          .single()
      : await supabase
          .from("submissions")
          .insert({
            job_id: application.job_id,
            application_id: application.id,
            creator_id: session.user.id,
            content_url: contentUrl,
            notes: trimmedNotes,
          })
          .select("id")
          .single()

    if (submitError || !savedRow) {
      setError(submitError?.message ?? "Failed to submit your work")
      setSubmittingId(null)
      return
    }

    setSubmissionsByApplication((prev) => ({
      ...prev,
      [application.id]: {
        id: savedRow.id,
        content_url: contentUrl,
        notes: trimmedNotes,
        status: "pending",
        reviewer_notes: null,
      },
    }))
    setSubmittingId(null)
  }

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
          applications.map((application) => {
            const submission = submissionsByApplication[application.id]
            const canSubmitWork =
              application.status === "accepted" &&
              (!submission || submission.status === "revision_requested")

            return (
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

                {application.status === "accepted" ? (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    {submission ? (
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SUBMISSION_BADGE[submission.status]}`}>
                          {SUBMISSION_LABEL[submission.status]}
                        </span>
                        {submission.status !== "pending" ? (
                          <a
                            href={submission.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
                          >
                            View submitted content
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {submission?.reviewer_notes ? (
                      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-medium text-slate-900">Feedback from the brand</p>
                        <p className="mt-1">{submission.reviewer_notes}</p>
                      </div>
                    ) : null}

                    {canSubmitWork ? (
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Content link</span>
                          <input
                            type="url"
                            required
                            placeholder="https://..."
                            value={formState[application.id]?.content_url ?? ""}
                            onChange={(event) =>
                              setFormState((prev) => ({
                                ...prev,
                                [application.id]: { ...prev[application.id], content_url: event.target.value, notes: prev[application.id]?.notes ?? "" },
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-slate-300 transition focus:border-slate-400 focus:ring-2"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Notes for the brand (optional)</span>
                          <textarea
                            rows={2}
                            value={formState[application.id]?.notes ?? ""}
                            onChange={(event) =>
                              setFormState((prev) => ({
                                ...prev,
                                [application.id]: { ...prev[application.id], notes: event.target.value, content_url: prev[application.id]?.content_url ?? "" },
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-slate-300 transition focus:border-slate-400 focus:ring-2"
                          />
                        </label>
                        <button
                          disabled={submittingId === application.id}
                          onClick={() => handleSubmitWork(application)}
                          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingId === application.id
                            ? "Submitting…"
                            : submission
                              ? "Resubmit"
                              : "Submit for review"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
