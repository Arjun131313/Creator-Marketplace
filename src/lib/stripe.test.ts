import { describe, expect, it } from "vitest"
import { platformFeeForAmount, PLATFORM_FEE_BPS } from "./stripe"

describe("platformFeeForAmount", () => {
  it("takes 10% of the amount", () => {
    expect(platformFeeForAmount(10_000)).toBe(1_000)
  })

  it("matches the configured PLATFORM_FEE_BPS", () => {
    expect(PLATFORM_FEE_BPS).toBe(1000)
  })

  it("rounds to the nearest whole minor unit", () => {
    expect(platformFeeForAmount(333)).toBe(33) // 33.3 rounded down
  })

  it("returns 0 for a zero amount", () => {
    expect(platformFeeForAmount(0)).toBe(0)
  })

  it("scales linearly with larger amounts", () => {
    expect(platformFeeForAmount(100_000)).toBe(10_000)
  })
})
