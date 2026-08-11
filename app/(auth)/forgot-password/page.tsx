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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-display text-2xl font-extrabold text-[#10141b]">
          RealReach.
        </Link>

        <div className="border-2 border-[#10141b] bg-white p-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#10141b]">Reset your password</h1>
          <p className="mt-2 text-sm text-[#595e66]">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="mt-8 border-2 border-[#c8f23c] bg-[#c8f23c]/20 px-4 py-3 text-sm text-[#182704]">
              If an account exists for {email}, a reset link is on its way. Check your inbox.
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#595e66]">
            <Link href="/login" className="font-bold text-[#1a54f0] hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
