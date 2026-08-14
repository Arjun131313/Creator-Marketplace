"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const CATEGORIES = ["Pitching", "Content creation", "Negotiation", "Growth", "Other"]

const inputClass =
  "mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"

export default function NewLessonPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [contentUrl, setContentUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function validateCreator() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profile?.role !== "creator") {
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
      }
    }

    validateCreator()
  }, [router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    const { data: lesson, error: lessonError } = await supabase
      .from("academy_lessons")
      .insert({
        creator_id: session.user.id,
        title,
        description,
        price: Number(price),
        category: category || null,
      })
      .select("id")
      .single()

    if (lessonError || !lesson) {
      setError(lessonError?.message ?? "Failed to publish lesson")
      setLoading(false)
      return
    }

    const { error: contentError } = await supabase.from("academy_lesson_content").insert({
      lesson_id: lesson.id,
      content_url: contentUrl,
    })

    if (contentError) {
      setError(contentError.message)
      setLoading(false)
      return
    }

    router.push("/creator/academy")
  }

  return (
    <div className="max-w-3xl border-2 border-[#10141b] bg-white p-8">
      <h1 className="font-display text-2xl font-extrabold text-[#10141b]">Teach a lesson</h1>
      <p className="mt-2 text-sm text-[#595e66]">
        Share what you know — pitching, pricing, content, whatever&apos;s made a difference for you.
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-bold text-[#10141b]">Title</span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-[#10141b]">Description</span>
          <textarea
            required
            rows={5}
            placeholder="What will buyers learn? Be specific."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass + " min-h-[140px]"}
          />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-[#10141b]">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass + " cursor-pointer"}>
              <option value="">Select a category (optional)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#10141b]">Price (GBP)</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#595e66]">£</span>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass + " pl-8"}
              />
            </div>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-[#10141b]">Content link</span>
          <input
            type="url"
            required
            placeholder="https://... (Loom, YouTube unlisted, Google Drive, PDF, etc.)"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[#8b8f96]">
            Only shown to buyers after purchase and to you. Anyone with the link could still view it — treat it as
            unlisted, not fully private.
          </p>
        </label>

        {error ? (
          <div className="border-2 border-[#ff534b] bg-white px-4 py-3 text-sm text-[#ff534b]">{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Publishing…" : "Publish lesson"}
        </button>
      </form>
    </div>
  )
}
