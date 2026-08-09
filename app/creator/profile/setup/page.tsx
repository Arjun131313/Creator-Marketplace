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
  avatar_url: string | null
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
  { border: "border-[#18140f]/15", badge: "bg-[#18140f]/5 text-[#3a332a]" },
  { border: "border-[#c1440e]/40", badge: "bg-[#c1440e]/10 text-[#c1440e]" },
  { border: "border-amber-500/40", badge: "bg-amber-500/10 text-amber-700" },
]

const PLATFORMS = [
  { key: "instagram" as const, label: "Instagram followers", placeholder: "e.g. 50000" },
  { key: "tiktok" as const, label: "TikTok followers", placeholder: "e.g. 120000" },
  { key: "snapchat" as const, label: "Snapchat followers", placeholder: "e.g. 25000" },
]

const inputClass =
  "w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] placeholder:text-[#8b8578] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
const labelClass = "block text-sm font-medium text-[#3a332a] mb-2"

export default function CreatorProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [form, setForm] = useState<FormState>({
    display_name: "",
    bio: "",
    niche: "",
    avatar_url: null,
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

      setUserId(session.user.id)

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,display_name,bio,niche,avatar_url,platform_stats,packages")
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
        avatar_url: profile.avatar_url ?? null,
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !userId) return

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for your avatar.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar images must be under 5MB.")
      return
    }

    setUploadingAvatar(true)
    setError(null)

    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${userId}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path)
    setForm((p) => ({ ...p, avatar_url: publicUrlData.publicUrl }))
    setUploadingAvatar(false)
  }

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
        avatar_url: form.avatar_url,
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
        <p className="text-[#6b6153]">Loading your profile…</p>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">Creator onboarding</p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-[#18140f]">Complete your profile</h1>
        <p className="mt-2 text-[#6b6153]">
          Help brands discover you by filling in your profile details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identity */}
        <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
          <h2 className="font-serif text-lg text-[#18140f]">Your identity</h2>
          <p className="mt-1 text-sm text-[#6b6153]">How you appear to brands on RealReach Agency.</p>

          <div className="mt-6 flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#18140f]/15 bg-[#f5f1e8]">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt="Your avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-[#8b8578]">
                  {form.display_name ? form.display_name[0]?.toUpperCase() : "?"}
                </span>
              )}
            </div>
            <div>
              <label className="inline-flex cursor-pointer items-center rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-sm font-medium text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]">
                {uploadingAvatar ? "Uploading…" : "Change photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={handleAvatarChange}
                />
              </label>
              <p className="mt-2 text-xs text-[#8b8578]">JPG or PNG, up to 5MB.</p>
            </div>
          </div>

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
                className={inputClass + " cursor-pointer"}
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
        <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
          <h2 className="font-serif text-lg text-[#18140f]">Platform stats</h2>
          <p className="mt-1 text-sm text-[#6b6153]">
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
        <section className="border border-[#18140f]/10 bg-[#fbf9f4] p-8">
          <h2 className="font-serif text-lg text-[#18140f]">Your packages</h2>
          <p className="mt-1 text-sm text-[#6b6153]">
            Define what brands can purchase from you at each tier.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {form.packages.map((pkg, index) => {
              const style = PACKAGE_STYLES[index]
              return (
                <div
                  key={index}
                  className={`space-y-4 border ${style.border} bg-white/40 p-5`}
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
                    <label className={labelClass}>Price (GBP) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6b6153]">
                        £
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
          <div className="border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/creator/dashboard")}
            className="text-sm text-[#6b6153] transition hover:text-[#18140f]"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-[2px] bg-[#c1440e] px-8 py-4 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving your profile…" : "Save and continue"}
          </button>
        </div>
      </form>
    </div>
  )
}
