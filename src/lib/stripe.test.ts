import { describe, expect, it } from "vitest"
import { platformFeeForAmount } from "./stripe"

describe("platformFeeForAmount", () => {
  it("takes 5% of the amount", () => {
    expect(platformFeeForAmount(10_000)).toBe(500)
  })

  it("rounds to the nearest whole minor unit", () => {
    expect(platformFeeForAmount(333)).toBe(17) // 16.65 rounded up
  })

  it("returns 0 for a zero amount", () => {
    expect(platformFeeForAmount(0)).toBe(0)
  })

  it("scales linearly with larger amounts", () => {
    expect(platformFeeForAmount(100_000)).toBe(5_000)
  })
})
