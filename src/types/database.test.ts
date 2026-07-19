import { describe, expect, it } from "vitest"
import { getPlatformFollowers, getPlatformUsername } from "./database"
import type { PlatformStats } from "./database"

describe("getPlatformFollowers", () => {
  it("returns null for null stats", () => {
    expect(getPlatformFollowers(null, "instagram")).toBeNull()
  })

  it("returns null for undefined stats", () => {
    expect(getPlatformFollowers(undefined, "instagram")).toBeNull()
  })

  it("returns null when the platform itself is null", () => {
    const stats: PlatformStats = { instagram: null, tiktok: null, snapchat: null }
    expect(getPlatformFollowers(stats, "instagram")).toBeNull()
  })

  it("returns followers from the current object shape", () => {
    const stats: PlatformStats = {
      instagram: { followers: 84000, username: "rae.holloway" },
      tiktok: null,
      snapchat: null,
    }
    expect(getPlatformFollowers(stats, "instagram")).toBe(84000)
  })

  it("falls back to the legacy raw-number shape", () => {
    const legacyStats = { instagram: 12000, tiktok: null, snapchat: null } as unknown as PlatformStats
    expect(getPlatformFollowers(legacyStats, "instagram")).toBe(12000)
  })

  it("returns null when followers is missing from the object", () => {
    const stats: PlatformStats = {
      instagram: { followers: null, username: "someone" },
      tiktok: null,
      snapchat: null,
    }
    expect(getPlatformFollowers(stats, "instagram")).toBeNull()
  })
})

describe("getPlatformUsername", () => {
  it("returns null for null stats", () => {
    expect(getPlatformUsername(null, "tiktok")).toBeNull()
  })

  it("returns the username from the current object shape", () => {
    const stats: PlatformStats = {
      instagram: null,
      tiktok: { followers: 5000, username: "@raeholloway" },
      snapchat: null,
    }
    expect(getPlatformUsername(stats, "tiktok")).toBe("@raeholloway")
  })

  it("returns null for the legacy raw-number shape (no username available)", () => {
    const legacyStats = { instagram: null, tiktok: 5000, snapchat: null } as unknown as PlatformStats
    expect(getPlatformUsername(legacyStats, "tiktok")).toBeNull()
  })
})
