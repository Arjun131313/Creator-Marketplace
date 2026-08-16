import { describe, expect, it } from "vitest"
import { escapeHtml, formatMoney } from "./notifications"

describe("escapeHtml", () => {
  it("neutralises a script tag in user-supplied text", () => {
    // Job titles, dispute reasons, and reviewer notes are written by users and
    // interpolated straight into email HTML.
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    )
  })

  it("escapes ampersands before the entities it introduces", () => {
    // Escaping & last would double-encode the entities produced by < and >.
    expect(escapeHtml("Ben & Jerry's <b>")).toBe("Ben &amp; Jerry's &lt;b&gt;")
  })

  it("stops an attribute break-out", () => {
    expect(escapeHtml('" onmouseover="steal()')).toBe("&quot; onmouseover=&quot;steal()")
  })

  it("leaves ordinary copy untouched", () => {
    expect(escapeHtml("Spring campaign — 3 TikToks")).toBe("Spring campaign — 3 TikToks")
  })

  it("handles empty strings", () => {
    expect(escapeHtml("")).toBe("")
  })
})

describe("formatMoney", () => {
  it("always shows two decimal places", () => {
    expect(formatMoney(300)).toBe("£300.00")
    expect(formatMoney(49.5)).toBe("£49.50")
  })

  it("groups thousands", () => {
    expect(formatMoney(1250)).toBe("£1,250.00")
  })

  it("formats zero rather than rendering an empty fee", () => {
    expect(formatMoney(0)).toBe("£0.00")
  })

  it("rounds to the penny", () => {
    expect(formatMoney(30.005)).toBe("£30.01")
    expect(formatMoney(29.994)).toBe("£29.99")
  })
})
