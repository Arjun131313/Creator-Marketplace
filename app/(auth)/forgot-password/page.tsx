"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f3f7] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-display text-2xl font-extrabold text-[#0d1117]">
          RealReach.
        </Link>

        <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#0d1117]">Reset your password</h1>
          <p className="mt-2 text-sm text-[#5b6472]">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="mt-8 rounded-[12px] bg-[#c8f23c]/20 px-4 py-3 text-sm text-[#101a3d]">
              If an account exists for {email}, a reset link is on its way. Check your inbox.
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#5b6472]">
            <Link href="/login" className="font-bold text-[#16255c] hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
