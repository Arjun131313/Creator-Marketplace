"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NICHES = [
  "Beauty", "Fashion", "Fitness", "Food", "Travel",
  "Gaming", "Tech", "Lifestyle", "Business", "Other",
] as const

type PackageForm = { name: string; description: string; price: string }

type FormState = {
  display_name: string
  bio: string
  niche: string
  instagram: string
  tiktok: string
  snapchat: string
  packages: [PackageForm, PackageForm, PackageForm]
}

const DEFAULT_PACKAGES: [PackageForm, PackageForm, PackageForm] = [
  { name: "Basic", description: "", price: "" },
  { name: "Standard", description: "", price: "" },
  { name: "Premium", description: "", price: "" },
]

const PACKAGE_STYLES = [
  { border: "border-slate-500/40", badge: "bg-slate-500/15 text-slate-300" },
  { border: "border-violet-500/40", badge: "bg-violet-500/15 text-violet-300" },
  { border: "border-amber-500/40", badge: "bg-amber-500/15 text-amber-300" },
]

const PLATFORMS = [
  { key: "instagram" as const, label: "Instagram followers", placeholder: "e.g. 50000" },
  { key: "tiktok" as const, label: "TikTok followers", placeholder: "e.g. 120000" },
  { key: "snapchat" as const, label: "Snapchat followers", placeholder: "e.g. 25000" },
]

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
const labelClass = "block text-sm font-medium text-slate-300 mb-2"

export default function CreatorProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    display_name: "",
    bio: "",
    niche: "",
    instagram: "",
    tiktok: "",
    snapchat: "",
    packages: DEFAULT_PACKAGES,
  })

  useEffect(() => {
    async function loadExistingProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,display_name,bio,niche,platform_stats,packages")
        .eq("id", session.user.id)
        .single()

      if (!profile || profile.role !== "creator") {
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
        return
      }

      const stats = profile.platform_stats
      const pkgs = profile.packages

      setForm({
        display_name: profile.display_name ?? "",
        bio: profile.bio ?? "",
        niche: profile.niche ?? "",
        instagram: stats?.instagram?.toString() ?? "",
        tiktok: stats?.tiktok?.toString() ?? "",
        snapchat: stats?.snapchat?.toString() ?? "",
        packages:
          Array.isArray(pkgs) && pkgs.length === 3
            ? (pkgs.map((p) => ({
                name: p.name,
                description: p.description,
                price: p.price.toString(),
              })) as [PackageForm, PackageForm, PackageForm])
            : DEFAULT_PACKAGES,
      })

      setLoading(false)
    }

    loadExistingProfile()
  }, [router])

  function updatePackage(index: number, field: keyof PackageForm, value: string) {
    setForm((prev) => {
      const updated = [...prev.packages] as [PackageForm, PackageForm, PackageForm]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, packages: updated }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push("/login")
      return
    }

    const response = await fetch("/api/creator/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        display_name: form.display_name.trim() || null,
        bio: form.bio.trim() || null,
        niche: form.niche || null,
        platform_stats: {
          instagram: form.instagram ? parseInt(form.instagram, 10) : null,
          tiktok: form.tiktok ? parseInt(form.tiktok, 10) : null,
          snapchat: form.snapchat ? parseInt(form.snapchat, 10) : null,
        },
        packages: form.packages.map((pkg) => ({
          name: pkg.name.trim(),
          description: pkg.description.trim(),
          price: parseFloat(pkg.price) || 0,
        })),
      }),
    })

    const data = (await response.json()) as { error?: string }

    if (!response.ok) {
      setError(data.error ?? "Failed to save profile. Please try again.")
      setSaving(false)
      return
    }

    router.push("/creator/dashboard")
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">Loading your profile…</p>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Creator onboarding</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Complete your profile</h1>
        <p className="mt-2 text-slate-400">
          Help brands discover you by filling in your profile details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identity */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-lg font-semibold text-white">Your identity</h2>
          <p className="mt-1 text-sm text-slate-400">How you appear to brands on CreatorHub.</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Display name *</label>
              <input
                type="text"
                required
                value={form.display_name}
                onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                placeholder="Your name or creator alias"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Bio *</label>
              <textarea
                required
                rows={4}
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell brands what you create and why they should work with you…"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Niche *</label>
              <select
                required
                value={form.niche}
                onChange={(e) => setForm((p) => ({ ...p, niche: e.target.value }))}
                className={inputClass + " bg-slate-900 cursor-pointer"}
              >
                <option value="" disabled>
                  Select your niche
                </option>
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Platform stats */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-lg font-semibold text-white">Platform stats</h2>
          <p className="mt-1 text-sm text-slate-400">
            Add your follower counts so brands can evaluate your reach.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {PLATFORMS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Packages */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-lg font-semibold text-white">Your packages</h2>
          <p className="mt-1 text-sm text-slate-400">
            Define what brands can purchase from you at each tier.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {form.packages.map((pkg, index) => {
              const style = PACKAGE_STYLES[index]
              return (
                <div
                  key={index}
                  className={`rounded-2xl border ${style.border} bg-white/[0.03] p-5 space-y-4`}
                >
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}
                  >
                    {pkg.name}
                  </span>

                  <div>
                    <label className={labelClass}>Package name *</label>
                    <input
                      type="text"
                      required
                      value={pkg.name}
                      onChange={(e) => updatePackage(index, "name", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={pkg.description}
                      onChange={(e) => updatePackage(index, "description", e.target.value)}
                      placeholder="What's included in this package…"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Price (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={pkg.price}
                        onChange={(e) => updatePackage(index, "price", e.target.value)}
                        placeholder="0.00"
                        className={inputClass + " pl-8"}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-400">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/creator/dashboard")}
            className="text-sm text-slate-400 hover:text-slate-300 transition"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving your profile…" : "Save and continue"}
          </button>
        </div>
      </form>
    </div>
  )
}
