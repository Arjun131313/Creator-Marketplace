"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type DisputeRow = {
  id: string
  job_id: string
  payment_id: string | null
  raised_by: string
  reason: string
  status: "open" | "under_review" | "resolved" | "closed"
  resolution: string | null
  created_at: string
  resolved_at: string | null
  job_title: string
  raised_by_name: string
  raised_by_role: string
  amount: number | null
  payment_status: string | null
  brand_name: string
  creator_name: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function daysOpen(iso: string, now: number) {
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000)
}

export default function AdminDisputesPage() {
  const router = useRouter()
  const [disputes, setDisputes] = useState<DisputeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [now, setNow] = useState(0)

  const [openId, setOpenId] = useState<string | null>(null)
  const [resolutions, setResolutions] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login?next=/admin")
        return
      }

      // RLS only returns this row to the admin themselves, so an empty result
      // is the access check — there's no client-side flag to spoof.
      const { data: membership } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (!membership) {
        if (mounted) {
          setDenied(true)
          setLoading(false)
        }
        return
      }

      const { data: rows } = await supabase
        .from("disputes")
        .select("id,job_id,payment_id,raised_by,reason,status,resolution,created_at,resolved_at")
        .order("created_at", { ascending: false })

      const list = rows ?? []
      if (list.length === 0) {
        if (mounted) {
          setDisputes([])
          setNow(Date.now())
          setLoading(false)
        }
        return
      }

      const jobIds = Array.from(new Set(list.map((d) => d.job_id)))
      const paymentIds = list.map((d) => d.payment_id).filter((id): id is string => Boolean(id))

      const [{ data: jobs }, { data: payments }] = await Promise.all([
        supabase.from("jobs").select("id,title,brand_id").in("id", jobIds),
        paymentIds.length
          ? supabase.from("payments").select("id,amount,status,creator_id,brand_id").in("id", paymentIds)
          : Promise.resolve({ data: [] as never[] }),
      ])

      const jobById = new Map((jobs ?? []).map((j) => [j.id, j]))
      const paymentById = new Map((payments ?? []).map((p) => [p.id, p]))

      const peopleIds = new Set<string>()
      list.forEach((d) => peopleIds.add(d.raised_by))
      ;(jobs ?? []).forEach((j) => peopleIds.add(j.brand_id))
      ;(payments ?? []).forEach((p) => {
        peopleIds.add(p.creator_id)
        peopleIds.add(p.brand_id)
      })

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,role")
        .in("id", Array.from(peopleIds))

      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

      if (!mounted) return

      setDisputes(
        list.map((d) => {
          const job = jobById.get(d.job_id)
          const payment = d.payment_id ? paymentById.get(d.payment_id) : null
          const raiser = profileById.get(d.raised_by)
          return {
            ...d,
            job_title: job?.title ?? "Unknown job",
            raised_by_name: raiser?.display_name ?? "Unknown",
            raised_by_role: raiser?.role ?? "unknown",
            amount: payment?.amount ?? null,
            payment_status: payment?.status ?? null,
            brand_name: profileById.get(job?.brand_id ?? "")?.display_name ?? "Unknown brand",
            creator_name: profileById.get(payment?.creator_id ?? "")?.display_name ?? "Unknown creator",
          }
        }),
      )
      setNow(Date.now())
      setLoading(false)
    })()

    return () => {
      mounted = false
    }
  }, [router, reloadToken])

  async function resolve(disputeId: string, outcome: "release" | "refund") {
    const resolution = resolutions[disputeId]?.trim() ?? ""
    if (resolution.length < 10) {
      setError("Write a resolution of at least 10 characters — both parties see it.")
      return
    }

    setBusy(disputeId)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch("/api/admin/disputes/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ disputeId, outcome, resolution }),
    })

    const data = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(data.error ?? "Couldn't resolve the dispute.")
      setBusy(null)
      return
    }

    setBusy(null)
    setOpenId(null)
    setReloadToken((n) => n + 1)
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[16px] bg-white/5" />
  }

  if (denied) {
    return (
      <div className="rounded-[16px] bg-white/5 p-10 text-center">
        <h1 className="font-display text-2xl font-extrabold">Not found</h1>
        <p className="mt-2 text-sm text-[#8891a3]">
          This area is for RealReach staff. If you think you should have access, it&apos;s granted by
          adding your user to the admin list.
        </p>
      </div>
    )
  }

  const open = disputes.filter((d) => d.status === "open" || d.status === "under_review")
  const closed = disputes.filter((d) => d.status === "resolved" || d.status === "closed")

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Disputes</h1>
      <p className="mt-3 max-w-xl text-[#8891a3]">
        Every open dispute has money frozen behind it. Releasing pays the creator; refunding returns
        it to the brand. Both parties are emailed your decision.
      </p>

      {error ? (
        <div className="mt-6 rounded-[12px] bg-[#ff534b]/15 px-5 py-4 text-sm text-[#ff534b]">
          {error}
        </div>
      ) : null}

      {open.length === 0 ? (
        <div className="mt-8 rounded-[16px] bg-white/5 p-10 text-center">
          <p className="font-display text-xl font-extrabold">No open disputes</p>
          <p className="mt-2 text-sm text-[#8891a3]">Nothing needs your decision right now.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {open.map((d) => (
            <article key={d.id} className="rounded-[16px] bg-white/[0.06] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-extrabold">{d.job_title}</p>
                  <p className="mt-1 text-sm text-[#8891a3]">
                    {d.brand_name} → {d.creator_name}
                    {d.amount !== null ? ` · £${d.amount.toLocaleString()}` : ""}
                    {d.payment_status ? ` · payment ${d.payment_status}` : " · no payment attached"}
                  </p>
                </div>
                <div className="text-right text-xs text-[#8891a3]">
                  <p className="font-bold text-[#feb930]">
                    {daysOpen(d.created_at, now)} day{daysOpen(d.created_at, now) !== 1 ? "s" : ""} open
                  </p>
                  <p className="mt-1">Raised {formatDate(d.created_at)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[12px] bg-[#0d1117] p-5">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8891a3]">
                  Raised by {d.raised_by_name} ({d.raised_by_role})
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{d.reason}</p>
              </div>

              {openId === d.id ? (
                <div className="mt-5">
                  <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8891a3]">
                    Your decision — both parties see this
                  </label>
                  <textarea
                    rows={4}
                    value={resolutions[d.id] ?? ""}
                    onChange={(e) => setResolutions((prev) => ({ ...prev, [d.id]: e.target.value }))}
                    placeholder="What you reviewed, and why you decided this way."
                    className="mt-2 w-full rounded-[8px] border border-white/15 bg-[#0d1117] px-4 py-3 text-sm outline-none placeholder:text-[#5b6472] focus:border-[#c8f23c]"
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      onClick={() => resolve(d.id, "release")}
                      disabled={busy === d.id}
                      className="rounded-[8px] bg-[#c8f23c] px-5 py-3 text-sm font-bold text-[#101a3d] transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {busy === d.id ? "Working…" : "Release to creator"}
                    </button>
                    <button
                      onClick={() => resolve(d.id, "refund")}
                      disabled={busy === d.id}
                      className="rounded-[8px] bg-[#ff534b] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {busy === d.id ? "Working…" : "Refund the brand"}
                    </button>
                    <button
                      onClick={() => setOpenId(null)}
                      className="px-4 py-3 text-sm font-bold text-[#8891a3] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setOpenId(d.id)}
                  className="mt-5 rounded-[8px] border border-white/20 px-5 py-3 text-sm font-bold transition-colors hover:bg-white hover:text-[#0d1117]"
                >
                  Resolve this
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {closed.length > 0 ? (
        <>
          <h2 className="mt-14 font-display text-2xl font-extrabold">Resolved</h2>
          <div className="mt-5 space-y-3">
            {closed.map((d) => (
              <article key={d.id} className="rounded-[12px] bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-bold">{d.job_title}</p>
                  <p className="text-xs text-[#8891a3]">
                    {d.resolved_at ? `Resolved ${formatDate(d.resolved_at)}` : d.status}
                  </p>
                </div>
                {d.resolution ? (
                  <p className="mt-2 text-sm leading-6 text-[#8891a3]">{d.resolution}</p>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
