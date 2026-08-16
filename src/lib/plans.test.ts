import { describe, expect, it } from "vitest"
import {
  PLANS,
  PUBLIC_PLANS,
  checkHireGate,
  getPlan,
  hireGateMessage,
  planIsEntitled,
} from "./plans"

describe("plan definitions", () => {
  it("matches the prices advertised on /pricing", () => {
    expect(PLANS.starter.price).toBe("£49.99")
    expect(PLANS.basic.price).toBe("£149.99")
    expect(PLANS.pro.price).toBe("£349.99")
    expect(PLANS.enterprise.price).toBe("Tailored to you")
  })

  it("keeps the displayed price and the charged amount in step", () => {
    // A mismatch here would mean charging a different number than the page shows.
    for (const plan of PUBLIC_PLANS) {
      if (plan.priceInPence === null) continue
      expect(plan.price).toBe(`£${(plan.priceInPence / 100).toFixed(2)}`)
    }
  })

  it("describes its own hire limit accurately", () => {
    expect(PLANS.starter.hires).toContain(String(PLANS.starter.hireLimit))
    expect(PLANS.basic.hires).toContain(String(PLANS.basic.hireLimit))
    expect(PLANS.pro.hires).toContain(String(PLANS.pro.hireLimit))
  })

  it("only offers self-serve checkout for plans that have a price", () => {
    for (const plan of Object.values(PLANS)) {
      if (plan.selfServe) expect(plan.priceInPence).not.toBeNull()
    }
  })

  it("does not sell the hand-granted founding plan publicly", () => {
    expect(PUBLIC_PLANS.map((p) => p.id)).not.toContain("founding")
    expect(PLANS.founding.selfServe).toBe(false)
  })

  it("resolves unknown or missing plan ids to null", () => {
    expect(getPlan(null)).toBeNull()
    expect(getPlan(undefined)).toBeNull()
    expect(getPlan("")).toBeNull()
    expect(getPlan("free")).toBeNull()
    expect(getPlan("pro")?.id).toBe("pro")
  })
})

describe("planIsEntitled", () => {
  it("entitles active and trialing subscriptions", () => {
    expect(planIsEntitled("active")).toBe(true)
    expect(planIsEntitled("trialing")).toBe(true)
  })

  it("blocks lapsed subscriptions", () => {
    expect(planIsEntitled("past_due")).toBe(false)
    expect(planIsEntitled("canceled")).toBe(false)
    expect(planIsEntitled("unpaid")).toBe(false)
    expect(planIsEntitled("incomplete")).toBe(false)
  })

  it("entitles hand-granted plans, which carry no Stripe status", () => {
    expect(planIsEntitled(null)).toBe(true)
    expect(planIsEntitled(undefined)).toBe(true)
  })
})

describe("checkHireGate", () => {
  it("blocks a brand with no plan", () => {
    const result = checkHireGate(null, null, 0)
    expect(result.allowed).toBe(false)
    expect(result.allowed === false && result.reason).toBe("no_plan")
  })

  it("allows a hire inside the allowance", () => {
    const result = checkHireGate("starter", "active", 4)
    expect(result.allowed).toBe(true)
    expect(result.allowed && result.limit).toBe(5)
  })

  it("blocks the hire that would exceed the allowance", () => {
    const result = checkHireGate("starter", "active", 5)
    expect(result.allowed).toBe(false)
    expect(result.allowed === false && result.reason).toBe("limit_reached")
  })

  it("stays blocked past the limit rather than wrapping around", () => {
    const result = checkHireGate("starter", "active", 99)
    expect(result.allowed).toBe(false)
    expect(result.allowed === false && result.reason).toBe("limit_reached")
  })

  it("blocks a past_due plan even with allowance left", () => {
    const result = checkHireGate("pro", "past_due", 0)
    expect(result.allowed).toBe(false)
    expect(result.allowed === false && result.reason).toBe("inactive")
  })

  it("blocks an unknown plan id rather than failing open", () => {
    // A typo or a plan removed from the code must never grant unlimited hiring.
    expect(checkHireGate("platinum", "active", 0).allowed).toBe(false)
  })

  it("lets hand-granted founding brands hire without a Stripe status", () => {
    const result = checkHireGate("founding", null, 3)
    expect(result.allowed).toBe(true)
    expect(result.allowed && result.limit).toBe(25)
  })

  it("holds founding brands to their limit too", () => {
    expect(checkHireGate("founding", null, 25).allowed).toBe(false)
  })

  it("does not cap enterprise at a normal tier's limit", () => {
    expect(checkHireGate("enterprise", "active", 500).allowed).toBe(true)
  })
})

describe("hireGateMessage", () => {
  it("returns nothing when the hire is allowed", () => {
    expect(hireGateMessage(checkHireGate("pro", "active", 0))).toBe("")
  })

  it("names the limit that was hit", () => {
    const message = hireGateMessage(checkHireGate("starter", "active", 5))
    expect(message).toContain("5")
    expect(message).toContain("Starter")
  })

  it("explains a lapsed plan without exposing internals", () => {
    const message = hireGateMessage(checkHireGate("pro", "past_due", 0))
    expect(message).toContain("past_due")
    expect(message).toContain("Pro")
  })

  it("tells a brand with no plan that briefs stay free", () => {
    expect(hireGateMessage(checkHireGate(null, null, 0))).toContain("free")
  })
})
