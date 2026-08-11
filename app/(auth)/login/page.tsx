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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-display text-2xl font-extrabold text-[#10141b]">
          RealReach.
        </Link>

        <div className="border-2 border-[#10141b] bg-white p-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#10141b]">Log in</h1>
          <p className="mt-2 text-sm text-[#595e66]">
            Access your brand or creator dashboard.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-[#10141b]">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
                />
              </label>
              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#10141b]">Password</span>
                  <Link href="/forgot-password" className="text-sm font-bold text-[#1a54f0] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
                />
              </label>
            </div>

            {message ? (
              <div className="border-2 border-[#ff534b] bg-white px-4 py-3 text-sm text-[#ff534b]">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center border-2 border-[#10141b] bg-[#1a54f0] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#595e66]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold text-[#1a54f0] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
