"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id ?? data.session?.user?.id

    if (!userId) {
      setMessage("Unable to identify the user. Please try again.")
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    let role = profile?.role

    if (!role) {
      role = data.user?.user_metadata?.role

      if (role) {
        await supabase.from("profiles").upsert({ id: userId, role })
      }
    }

    if (!role) {
      setMessage("Your account role could not be determined. Please sign up again.")
      setLoading(false)
      return
    }

    router.push(role === "brand" ? "/brand/dashboard" : "/creator/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#18140f] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-serif text-2xl text-[#f5f1e8]">
          Real<em className="not-italic italic text-[#e8a37c]">Reach</em>
        </Link>

        <div className="paper-card rounded-sm p-10">
          <h1 className="font-serif text-3xl font-medium text-[#18140f]">Log in</h1>
          <p className="mt-2 text-sm text-[#6b6153]">
            Access your brand or creator dashboard.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#3a332a]">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
                />
              </label>
              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#3a332a]">Password</span>
                  <Link href="/forgot-password" className="text-sm font-medium text-[#c1440e] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
                />
              </label>
            </div>

            {message ? (
              <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-[2px] bg-[#c1440e] px-5 py-3 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6b6153]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-[#c1440e] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
