"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<"brand" | "creator">("brand")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const userId = data?.user?.id ?? data?.session?.user?.id

    if (!userId) {
      setMessage(
        "Signup successful. Please check your inbox to confirm your email before logging in.",
      )
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, role })

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    router.push(role === "brand" ? "/brand/dashboard" : "/creator/profile/setup")
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold">Sign up</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create a Brand or Creator account.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl border border-zinc-200 p-4 text-center cursor-pointer transition hover:border-slate-400">
              <input
                type="radio"
                name="role"
                value="brand"
                checked={role === "brand"}
                onChange={() => setRole("brand")}
                className="sr-only"
              />
              <div className={role === "brand" ? "font-semibold text-slate-900" : "text-slate-600"}>
                Brand
              </div>
            </label>
            <label className="rounded-2xl border border-zinc-200 p-4 text-center cursor-pointer transition hover:border-slate-400">
              <input
                type="radio"
                name="role"
                value="creator"
                checked={role === "creator"}
                onChange={() => setRole("creator")}
                className="sr-only"
              />
              <div className={role === "creator" ? "font-semibold text-slate-900" : "text-slate-600"}>
                Creator
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition focus:border-slate-400 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition focus:border-slate-400 focus:ring-2"
              />
            </label>
          </div>

          {message ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  )
}
