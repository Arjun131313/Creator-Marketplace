"use client"

import Link from "next/link"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { PUBLIC_PLANS, getPlan, planIsEntitled, type Plan } from "@/lib/plans"

type BillingState = {
  plan: Plan | null
  status: string | null
  periodStart: string | null
  periodEnd: string | null
  hiresUsed: number
  hasCustomer: boolean
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

function startOfCurrentMonth(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

export default function BrandBillingPage() {
  return (
    <Suspense fallback={null}>
      <BrandBillingPageInner />
    </Suspense>
  )
}

function BrandBillingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justSubscribed = searchParams.get("subscribed") === "1"

  const [state, setState] = useState<BillingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      router.push("/login?next=/brand/billing")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan,plan_status,plan_period_start,plan_period_end,stripe_customer_id")
      .eq("id", session.user.id)
      .single()

    const periodStart = profile?.plan_period_start ?? startOfCurrentMonth()
    const { data: used } = await supabase.rpc("brand_hires_used", {
      brand: session.user.id,
      since: periodStart,
    })

    setState({
      plan: getPlan(profile?.plan),
      status: profile?.plan_status ?? null,
      periodStart,
      periodEnd: profile?.plan_period_end ?? null,
      hiresUsed: typeof used === "number" ? used : 0,
      hasCustomer: Boolean(profile?.stripe_customer_id),
    })
    setLoading(false)
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  // Stripe redirects back the instant checkout completes, which can beat the
  // webhook that writes the plan. One delayed refetch covers that gap.
  useEffect(() => {
    if (!justSubscribed) return
    const timer = setTimeout(load, 2500)
    return () => clearTimeout(timer)
  }, [justSubscribed, load])

  async function startCheckout(planId: string) {
    setBusy(planId)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ plan: planId }),
    })

    const data = (await response.json()) as { url?: string; error?: string }
    if (!response.ok || !data.url) {
      setError(data.error ?? "Couldn't start checkout. Please try again.")
      setBusy(null)
      return
    }
    window.location.href = data.url
  }

  async function openPortal() {
    setBusy("portal")
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch("/api/subscriptions/portal", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    })

    const data = (await response.json()) as { url?: string; error?: string }
    if (!response.ok || !data.url) {
      setError(data.error ?? "Couldn't open the billing portal. Please try again.")
      setBusy(null)
      return
    }
    window.location.href = data.url
  }

  if (loading || !state) {
    return <div className="h-64 animate-pulse rounded-[16px] bg-white/60" />
  }

  const { plan, status, hiresUsed, periodEnd } = state
  const entitled = plan !== null && planIsEntitled(status)
  const limit = plan?.hireLimit ?? 0
  const remaining = Math.max(0, limit - hiresUsed)
  const pct = limit > 0 && limit !== Number.MAX_SAFE_INTEGER
    ? Math.min(100, Math.round((hiresUsed / limit) * 100))
    : 0

  return (
    <div className="pb-16">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#16255c]">Billing</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Your plan</h1>
      <p className="mt-3 max-w-xl text-[#5b6472]">
        Briefs, browsing, and messaging are always free. A plan covers how many creators you can hire
        each month — the 10% creator fee is separate and comes out of their payout, not yours.
      </p>

      {justSubscribed ? (
        <div className="mt-6 rounded-[12px] bg-[#c8f23c]/20 px-5 py-4 text-sm font-bold text-[#101a3d]">
          Payment received — your plan is active. If it still says &ldquo;No plan&rdquo; below, give it a few
          seconds and refresh.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-[12px] bg-[#ff534b]/[0.07] px-5 py-4 text-sm text-[#ff534b] ring-1 ring-[#ff534b]/30">
          {error}
        </div>
      ) : null}

      {/* ── Current plan ────────────────────────────────────────────────────── */}
      <section className="mt-8 rounded-[16px] bg-white p-7 shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05]">
        {plan ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#5b6472]">
                  Current plan
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold">{plan.name}</p>
                <p className="mt-1 text-sm text-[#5b6472]">
                  {plan.price}
                  {plan.priceInPence !== null ? " a month" : ""}
                  {status && status !== "active" ? (
                    <span className="ml-2 font-bold text-[#ff534b]">· {status.replace("_", " ")}</span>
                  ) : null}
                </p>
              </div>

              {state.hasCustomer ? (
                <button
                  onClick={openPortal}
                  disabled={busy !== null}
                  className="rounded-[8px] bg-[#0d1117] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy === "portal" ? "Opening…" : "Manage billing"}
                </button>
              ) : null}
            </div>

            <div className="mt-7">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-bold">
                  {limit === Number.MAX_SAFE_INTEGER
                    ? `${hiresUsed} hires this month`
                    : `${hiresUsed} of ${limit} hires used`}
                </p>
                {limit !== Number.MAX_SAFE_INTEGER ? (
                  <p className="text-sm text-[#5b6472]">{remaining} left</p>
                ) : null}
              </div>
              {limit !== Number.MAX_SAFE_INTEGER ? (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e7ee]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 100 ? "bg-[#ff534b]" : "bg-[#16255c]"
                    }`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              ) : null}
              {periodEnd ? (
                <p className="mt-2 text-xs text-[#8b93a3]">Resets {formatDate(periodEnd)}</p>
              ) : (
                <p className="mt-2 text-xs text-[#8b93a3]">Resets at the start of each month</p>
              )}
            </div>

            {!entitled ? (
              <div className="mt-6 rounded-[12px] bg-[#ff534b]/[0.07] px-5 py-4 text-sm text-[#0d1117] ring-1 ring-[#ff534b]/30">
                Hiring is paused while your plan is <strong>{status}</strong>. Update your payment
                details in the billing portal to start hiring again.
              </div>
            ) : remaining === 0 && limit !== Number.MAX_SAFE_INTEGER ? (
              <div className="mt-6 rounded-[12px] bg-[#feb930]/15 px-5 py-4 text-sm text-[#0d1117]">
                You&apos;ve used every hire on {plan.name} this month. Upgrade below to keep hiring, or
                wait for your allowance to reset.
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#5b6472]">
              Current plan
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold">No plan</p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#5b6472]">
              You can post briefs, browse creators, and message anyone right now. You&apos;ll need a
              plan at the point you hire someone — pick one below.
            </p>
          </>
        )}
      </section>

      {/* ── Plan picker ─────────────────────────────────────────────────────── */}
      <h2 className="mt-12 font-display text-2xl font-extrabold">
        {plan ? "Change plan" : "Choose a plan"}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PUBLIC_PLANS.map((p) => {
          const isCurrent = plan?.id === p.id
          return (
            <div
              key={p.id}
              className={`flex flex-col rounded-[16px] p-6 transition-shadow ${
                isCurrent
                  ? "bg-[#0d1117] text-[#f1f3f7]"
                  : "bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] hover:shadow-[0_4px_10px_rgba(13,17,23,0.06),0_18px_44px_rgba(13,17,23,0.12)]"
              }`}
            >
              <p className="font-display text-xl font-extrabold">{p.name}</p>
              <p className="mt-2 font-display text-3xl font-extrabold">
                {p.price}
                {p.priceInPence !== null ? (
                  <span className={`text-sm font-bold ${isCurrent ? "text-[#8891a3]" : "text-[#5b6472]"}`}>
                    /mo
                  </span>
                ) : null}
              </p>
              <p className={`mt-2 text-sm ${isCurrent ? "text-[#8891a3]" : "text-[#5b6472]"}`}>
                {p.hires}
              </p>

              <div className="mt-6 flex-1" />

              {isCurrent ? (
                <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#c8f23c]">
                  Current plan
                </p>
              ) : p.selfServe ? (
                <button
                  onClick={() => startCheckout(p.id)}
                  disabled={busy !== null}
                  className="rounded-[8px] bg-[#16255c] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy === p.id ? "Starting…" : plan ? "Switch to this" : "Choose"}
                </button>
              ) : (
                <a
                  href="mailto:hello@realreachagency.com?subject=RealReach%20Enterprise%20enquiry"
                  className="rounded-[8px] border border-[#0d1117]/[0.12] px-4 py-3 text-center text-sm font-bold transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
                >
                  Talk to us
                </a>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-sm text-[#5b6472]">
        Full breakdown of what&apos;s included on the{" "}
        <Link href="/pricing" className="font-bold text-[#16255c] hover:underline">
          pricing page
        </Link>
        .
      </p>
    </div>
  )
}
