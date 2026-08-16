// Single source of truth for brand subscription plans.
//
// The pricing page, the checkout route, and the hire gate all read from here so
// the price a brand is shown is by construction the price they're charged and
// the limit they're held to. Changing a tier means changing it once.

export type PlanId = "starter" | "basic" | "pro" | "enterprise" | "founding"

export type Plan = {
  id: PlanId
  name: string
  /** Monthly price in pence. Null for plans that aren't self-serve. */
  priceInPence: number | null
  /** Display price, e.g. "£49.99". */
  price: string
  /** Creator hires included per billing month. */
  hireLimit: number
  /** Shown on the pricing card. */
  hires: string
  /** Self-serve plans get a Stripe Checkout; others get a mailto. */
  selfServe: boolean
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceInPence: 4999,
    price: "£49.99",
    hireLimit: 5,
    hires: "5 creator hires",
    selfServe: true,
  },
  basic: {
    id: "basic",
    name: "Basic",
    priceInPence: 14999,
    price: "£149.99",
    hireLimit: 20,
    hires: "20 creator hires",
    selfServe: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceInPence: 34999,
    price: "£349.99",
    hireLimit: 50,
    hires: "50 creator hires",
    selfServe: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceInPence: null,
    price: "Tailored to you",
    hireLimit: Number.MAX_SAFE_INTEGER,
    hires: "A custom number of hires",
    selfServe: false,
  },
  // Not sold. Granted by hand to founding brands while the marketplace is
  // building up supply, so early partners can hire without a card on file.
  // Set profiles.plan = 'founding' in Supabase to award it.
  founding: {
    id: "founding",
    name: "Founding partner",
    priceInPence: null,
    price: "Invitation only",
    hireLimit: 25,
    hires: "25 creator hires",
    selfServe: false,
  },
}

/** The tiers shown on /pricing, in display order. */
export const PUBLIC_PLANS: Plan[] = [PLANS.starter, PLANS.basic, PLANS.pro, PLANS.enterprise]

export function getPlan(id: string | null | undefined): Plan | null {
  if (!id) return null
  return PLANS[id as PlanId] ?? null
}

/** Plan statuses that still entitle a brand to hire. */
const ENTITLED_STATUSES = new Set(["active", "trialing"])

export function planIsEntitled(status: string | null | undefined): boolean {
  // Hand-granted plans (founding, enterprise) carry no Stripe subscription, so
  // a null status is treated as entitled — the plan itself is the grant.
  if (status === null || status === undefined) return true
  return ENTITLED_STATUSES.has(status)
}

export type HireGateResult =
  | { allowed: true; plan: Plan; used: number; limit: number }
  | { allowed: false; reason: "no_plan" }
  | { allowed: false; reason: "inactive"; plan: Plan; status: string }
  | { allowed: false; reason: "limit_reached"; plan: Plan; used: number; limit: number }

/**
 * Decides whether a brand may hire another creator this period.
 *
 * `used` is the number of hires already made in the current billing month —
 * counted by the caller, since only it has database access.
 */
export function checkHireGate(
  planId: string | null | undefined,
  status: string | null | undefined,
  used: number,
): HireGateResult {
  const plan = getPlan(planId)
  if (!plan) return { allowed: false, reason: "no_plan" }

  if (!planIsEntitled(status)) {
    return { allowed: false, reason: "inactive", plan, status: status ?? "unknown" }
  }

  if (used >= plan.hireLimit) {
    return { allowed: false, reason: "limit_reached", plan, used, limit: plan.hireLimit }
  }

  return { allowed: true, plan, used, limit: plan.hireLimit }
}

/** Human-readable message for a blocked hire, shown in the brand UI. */
export function hireGateMessage(result: HireGateResult): string {
  if (result.allowed) return ""
  switch (result.reason) {
    case "no_plan":
      return "Hiring a creator needs an active plan. Pick one to get started — briefs and messaging stay free."
    case "inactive":
      return `Your ${result.plan.name} plan is ${result.status}. Update your payment details to start hiring again.`
    case "limit_reached":
      return `You've used all ${result.limit} hires on ${result.plan.name} this month. Upgrade to hire more, or wait for your next billing date.`
  }
}
