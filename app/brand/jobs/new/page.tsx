"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NewJobPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function validateBrand() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profileError || profile?.role !== "brand") {
        router.push(profile?.role === "creator" ? "/creator/dashboard" : "/login")
      }
    }

    validateBrand()
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

    const budgetValue = Number(budget)

    const { error } = await supabase.from("jobs").insert({
      title,
      description,
      budget: budgetValue,
      currency: "gbp",
      deadline: deadline ? new Date(deadline).toISOString() : null,
      brand_id: session.user.id,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/brand/jobs")
  }

  return (
    <div className="max-w-3xl border-2 border-[#10141b] bg-white p-8">
      <h1 className="font-display text-2xl font-extrabold text-[#10141b]">Post a new job</h1>
      <p className="mt-2 text-sm text-[#595e66]">Create a job brief for creators to apply.</p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <label className="block">
            <span className="text-sm font-bold text-[#10141b]">Job title</span>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-[#10141b]">Description</span>
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-[160px] w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-[#10141b]">Budget (GBP)</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#595e66]">£</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] py-3 pl-8 pr-4 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#10141b]">Deadline</span>
              <input
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                className="mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
              />
            </label>
          </div>
        </div>

        {error ? (
          <div className="border-2 border-[#ff534b] bg-white px-4 py-3 text-sm text-[#ff534b]">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Publishing job…" : "Publish job"}
        </button>
      </form>
    </div>
  )
}
