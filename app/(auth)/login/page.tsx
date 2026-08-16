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
    <div className="flex min-h-screen items-center justify-center bg-[#f1f3f7] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-display text-2xl font-extrabold text-[#0d1117]">
          RealReach.
        </Link>

        <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#0d1117]">Log in</h1>
          <p className="mt-2 text-sm text-[#5b6472]">
            Access your brand or creator dashboard.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-[#0d1117]">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-4 py-3 text-sm text-[#0d1117] outline-none transition-colors focus:border-[#16255c]"
                />
              </label>
              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0d1117]">Password</span>
                  <Link href="/forgot-password" className="text-sm font-bold text-[#16255c] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-4 py-3 text-sm text-[#0d1117] outline-none transition-colors focus:border-[#16255c]"
                />
              </label>
            </div>

            {message ? (
              <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 px-4 py-3 text-sm text-[#ff534b]">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-[8px] bg-[#16255c] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#5b6472]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold text-[#16255c] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
