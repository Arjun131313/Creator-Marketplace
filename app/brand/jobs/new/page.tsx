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
    <div className="max-w-3xl border border-[#18140f]/10 bg-[#fbf9f4] p-8">
      <h1 className="font-serif text-2xl font-medium text-[#18140f]">Post a new job</h1>
      <p className="mt-2 text-sm text-[#6b6153]">Create a job brief for creators to apply.</p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <label className="block">
            <span className="text-sm font-medium text-[#3a332a]">Job title</span>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#3a332a]">Description</span>
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-[160px] w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#3a332a]">Budget (GBP)</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6b6153]">£</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="mt-2 w-full rounded-sm border border-[#18140f]/15 bg-white py-3 pl-8 pr-4 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#3a332a]">Deadline</span>
              <input
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                className="mt-2 w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
              />
            </label>
          </div>
        </div>

        {error ? (
          <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-[2px] bg-[#c1440e] px-6 py-3 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Publishing job…" : "Publish job"}
        </button>
      </form>
    </div>
  )
}
