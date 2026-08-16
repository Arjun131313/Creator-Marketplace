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
  requires_shipping: boolean
  shipping_address: string | null
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
  approved: "bg-[#c8f23c] text-[#101a3d]",
  rejected: "bg-[#ff534b] text-white",
  revision_requested: "bg-[#16255c] text-white",
}

const SUBMISSION_LABEL: Record<SubmissionStatus, string> = {
  pending: "Submitted — awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Revision requested",
}

type PaymentStatus = "pending" | "held" | "released" | "refunded" | "disputed"

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  pending: "bg-[#feb930] text-[#2b1d00]",
  held: "bg-[#16255c] text-white",
  released: "bg-[#c8f23c] text-[#101a3d]",
  refunded: "bg-[#0d1117]/10 text-[#5b6472]",
  disputed: "bg-[#ff534b] text-white",
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "Payment initiated",
  held: "Payment held in escrow",
  released: "Paid",
  refunded: "Refunded",
  disputed: "Disputed",
}

type DisputeStatus = "open" | "under_review" | "resolved" | "closed"

type Dispute = {
  id: string
  payment_id: string | null
  status: DisputeStatus
  reason: string
  resolution: string | null
}

const DISPUTE_BADGE: Record<DisputeStatus, string> = {
  open: "bg-[#ff534b] text-white",
  under_review: "bg-[#feb930] text-[#2b1d00]",
  resolved: "bg-[#c8f23c] text-[#101a3d]",
  closed: "bg-[#0d1117]/10 text-[#5b6472]",
}

const DISPUTE_LABEL: Record<DisputeStatus, string> = {
  open: "Dispute open",
  under_review: "Dispute under review",
  resolved: "Dispute resolved",
  closed: "Dispute closed",
}

export default function CreatorApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [submissionsByApplication, setSubmissionsByApplication] = useState<Record<string, Submission>>({})
  const [paymentsByApplication, setPaymentsByApplication] = useState<Record<string, { id: string; status: PaymentStatus }>>({})
  const [disputesByPayment, setDisputesByPayment] = useState<Record<string, Dispute>>({})
  const [disputeFormOpenFor, setDisputeFormOpenFor] = useState<string | null>(null)
  const [disputeReasons, setDisputeReasons] = useState<Record<string, string>>({})
  const [raisingDisputeFor, setRaisingDisputeFor] = useState<string | null>(null)
  const [formState, setFormState] = useState<Record<string, { content_url: string; notes: string }>>({})
  const [shippingAddressInput, setShippingAddressInput] = useState<Record<string, string>>({})
  const [savingShippingFor, setSavingShippingFor] = useState<string | null>(null)
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
        .select("id,job_id,status,pitch,proposed_rate,created_at,shipping_address,jobs(title,requires_shipping)")
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
        shipping_address: string | null
        jobs: { title: string; requires_shipping: boolean } | null
      }>

      const applicationItems = rows.map((item) => ({
        id: item.id,
        job_id: item.job_id,
        status: item.status,
        pitch: item.pitch,
        proposed_rate: item.proposed_rate,
        created_at: item.created_at,
        job_title: item.jobs?.title ?? "Job",
        requires_shipping: item.jobs?.requires_shipping ?? false,
        shipping_address: item.shipping_address,
      }))

      setApplications(applicationItems)

      const acceptedIds = applicationItems
        .filter((item) => item.status === "accepted")
        .map((item) => item.id)

      if (acceptedIds.length > 0) {
        const jobIds = Array.from(
          new Set(applicationItems.filter((item) => acceptedIds.includes(item.id)).map((item) => item.job_id)),
        )

        const [{ data: submissionRows }, { data: paymentRows }, { data: disputeRows }] = await Promise.all([
          supabase
            .from("submissions")
            .select("id,application_id,content_url,notes,status,reviewer_notes")
            .in("application_id", acceptedIds),
          supabase.from("payments").select("id,application_id,status").in("application_id", acceptedIds),
          supabase.from("disputes").select("id,payment_id,status,reason,resolution").in("job_id", jobIds),
        ])

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

        setPaymentsByApplication(
          Object.fromEntries(
            (paymentRows ?? []).map((row) => [
              row.application_id,
              { id: row.id, status: row.status as PaymentStatus },
            ]),
          ),
        )

        setDisputesByPayment(
          Object.fromEntries(
            (disputeRows ?? [])
              .filter((row): row is Dispute & { payment_id: string } => row.payment_id !== null)
              .map((row) => [row.payment_id, row as Dispute]),
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

  async function handleSaveShippingAddress(application: ApplicationItem) {
    const address = shippingAddressInput[application.id]?.trim()
    if (!address) return

    setSavingShippingFor(application.id)
    setError(null)

    const { error: updateError } = await supabase
      .from("applications")
      .update({ shipping_address: address })
      .eq("id", application.id)

    if (updateError) {
      setError(updateError.message)
      setSavingShippingFor(null)
      return
    }

    setApplications((prev) =>
      prev.map((a) => (a.id === application.id ? { ...a, shipping_address: address } : a)),
    )
    setSavingShippingFor(null)
  }

  async function handleRaiseDispute(application: ApplicationItem) {
    const payment = paymentsByApplication[application.id]
    const reason = disputeReasons[application.id]?.trim()
    if (!payment || !reason) return

    setRaisingDisputeFor(application.id)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push("/login")
      return
    }

    const response = await fetch("/api/disputes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ jobId: application.job_id, paymentId: payment.id, reason }),
    })

    const data = (await response.json()) as { dispute?: Dispute; error?: string }

    if (!response.ok || !data.dispute) {
      setError(data.error ?? "Failed to raise dispute")
      setRaisingDisputeFor(null)
      return
    }

    setDisputesByPayment((prev) => ({ ...prev, [payment.id]: data.dispute! }))
    if (payment.status === "held") {
      setPaymentsByApplication((prev) => ({
        ...prev,
        [application.id]: { id: payment.id, status: "disputed" },
      }))
    }
    setDisputeFormOpenFor(null)
    setRaisingDisputeFor(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#5b6472]">Loading your applications…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#0d1117]">My applications</h1>
            <p className="mt-1 text-sm text-[#5b6472]">Monitor your job applications and status updates.</p>
          </div>
          <Link href="/creator/jobs" className="text-sm font-bold text-[#16255c] hover:underline">
            Browse jobs
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 p-5 text-sm text-[#ff534b]">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#0d1117]/[0.14] p-8 text-[#5b6472]">
            You have not submitted any applications yet.
          </div>
        ) : (
          applications.map((application) => {
            const submission = submissionsByApplication[application.id]
            const canSubmitWork =
              application.status === "accepted" &&
              (!submission || submission.status === "revision_requested")

            return (
              <div key={application.id} className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-[#0d1117]">{application.job_title}</p>
                    <p className="mt-1 text-sm text-[#8b93a3]">Submitted {new Date(application.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <span className="bg-[#0d1117]/10 px-3 py-1 text-sm font-bold uppercase text-[#5b6472]">{application.status}</span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-bold text-[#0d1117]">Pitch</p>
                    <p className="mt-2 text-sm leading-6 text-[#5b6472]">{application.pitch}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0d1117]">Proposed rate</p>
                    <p className="mt-2 text-sm text-[#5b6472]">
                      {application.proposed_rate ? `£${application.proposed_rate.toFixed(2)}` : "Not specified"}
                    </p>
                  </div>
                </div>

                {application.status === "accepted" ? (
                  <div className="mt-5 border-t border-[#0d1117]/[0.07] pt-5">
                    {application.requires_shipping ? (
                      <div className="mb-4 rounded-[12px] bg-[#feb930]/15 p-4">
                        <p className="text-sm font-bold text-[#2b1d00]">This job ships a physical product</p>
                        {application.shipping_address ? (
                          <p className="mt-1 whitespace-pre-line text-sm text-[#0d1117]">
                            {application.shipping_address}
                          </p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <textarea
                              rows={3}
                              placeholder="Your full shipping address"
                              value={shippingAddressInput[application.id] ?? ""}
                              onChange={(e) => setShippingAddressInput((prev) => ({ ...prev, [application.id]: e.target.value }))}
                              className="w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-3 py-2 text-sm text-[#0d1117] outline-none placeholder:text-[#8b93a3] focus:border-[#16255c]"
                            />
                            <button
                              disabled={savingShippingFor === application.id || !shippingAddressInput[application.id]?.trim()}
                              onClick={() => handleSaveShippingAddress(application)}
                              className="inline-flex items-center justify-center rounded-[8px] bg-[#16255c] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingShippingFor === application.id ? "Saving…" : "Save shipping address"}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {paymentsByApplication[application.id] ? (
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span
                          className={`px-3 py-1 text-xs font-bold uppercase ${
                            PAYMENT_BADGE[paymentsByApplication[application.id].status]
                          }`}
                        >
                          {PAYMENT_LABEL[paymentsByApplication[application.id].status]}
                        </span>
                        {(() => {
                          const payment = paymentsByApplication[application.id]
                          const dispute = disputesByPayment[payment.id]
                          if (dispute) {
                            return (
                              <span className={`px-3 py-1 text-xs font-bold uppercase ${DISPUTE_BADGE[dispute.status]}`}>
                                {DISPUTE_LABEL[dispute.status]}
                              </span>
                            )
                          }
                          return (
                            <button
                              onClick={() => setDisputeFormOpenFor(disputeFormOpenFor === application.id ? null : application.id)}
                              className="text-xs font-bold text-[#ff534b] underline"
                            >
                              Raise a dispute
                            </button>
                          )
                        })()}
                      </div>
                    ) : null}

                    {paymentsByApplication[application.id]?.status === "held" ? (
                      <p className="mb-4 text-xs text-[#8b93a3]">
                        Paid automatically once the brand approves your work — or automatically within 7 days if they don&apos;t respond. No invoicing needed.
                      </p>
                    ) : null}

                    {disputeFormOpenFor === application.id ? (
                      <div className="mb-4 space-y-2 rounded-[12px] bg-[#ff534b]/[0.07] p-4">
                        <textarea
                          rows={2}
                          placeholder="Explain what's gone wrong — this is visible to RealReach and freezes this payment until resolved."
                          value={disputeReasons[application.id] ?? ""}
                          onChange={(e) => setDisputeReasons((prev) => ({ ...prev, [application.id]: e.target.value }))}
                          className="w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-3 py-2 text-sm text-[#0d1117] outline-none placeholder:text-[#8b93a3] focus:border-[#ff534b]"
                        />
                        <button
                          disabled={raisingDisputeFor === application.id || !disputeReasons[application.id]?.trim()}
                          onClick={() => handleRaiseDispute(application)}
                          className="inline-flex items-center justify-center rounded-[8px] bg-[#ff534b] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {raisingDisputeFor === application.id ? "Submitting…" : "Submit dispute"}
                        </button>
                      </div>
                    ) : null}

                    {submission ? (
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-bold uppercase ${SUBMISSION_BADGE[submission.status]}`}>
                          {SUBMISSION_LABEL[submission.status]}
                        </span>
                        {submission.status !== "pending" ? (
                          <a
                            href={submission.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#16255c] underline"
                          >
                            View submitted content
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {submission?.reviewer_notes ? (
                      <div className="mb-4 rounded-[12px] bg-[#f7f8fa] p-4 text-sm text-[#0d1117]">
                        <p className="font-bold text-[#0d1117]">Feedback from the brand</p>
                        <p className="mt-1">{submission.reviewer_notes}</p>
                      </div>
                    ) : null}

                    {canSubmitWork ? (
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-sm font-bold text-[#0d1117]">Content link</span>
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
                            className="mt-2 w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-4 py-2.5 text-sm text-[#0d1117] outline-none transition-colors focus:border-[#16255c]"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-bold text-[#0d1117]">Notes for the brand (optional)</span>
                          <textarea
                            rows={2}
                            value={formState[application.id]?.notes ?? ""}
                            onChange={(event) =>
                              setFormState((prev) => ({
                                ...prev,
                                [application.id]: { ...prev[application.id], notes: event.target.value, content_url: prev[application.id]?.content_url ?? "" },
                              }))
                            }
                            className="mt-2 w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-4 py-2.5 text-sm text-[#0d1117] outline-none transition-colors focus:border-[#16255c]"
                          />
                        </label>
                        <button
                          disabled={submittingId === application.id}
                          onClick={() => handleSubmitWork(application)}
                          className="inline-flex items-center justify-center rounded-[8px] bg-[#16255c] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
