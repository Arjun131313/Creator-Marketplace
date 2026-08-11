"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && mounted) {
        setReady(true)
      }
    })

    // The client parses the recovery link's URL fragment on init and may already
    // have a session by the time this effect runs, so check directly too.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session) {
        setReady(true)
        return
      }
      // Give the client a moment to finish parsing the URL before giving up.
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
          if (mounted && !retrySession) setInvalid(true)
        })
      }, 1500)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push("/login"), 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-display text-2xl font-extrabold text-[#10141b]">
          RealReach.
        </Link>

        <div className="border-2 border-[#10141b] bg-white p-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#10141b]">Set a new password</h1>

          {invalid ? (
            <>
              <p className="mt-2 text-sm text-[#595e66]">
                This reset link is invalid or has expired.
              </p>
              <p className="mt-6 text-center text-sm">
                <Link href="/forgot-password" className="font-bold text-[#1a54f0] hover:underline">
                  Request a new link
                </Link>
              </p>
            </>
          ) : success ? (
            <div className="mt-8 border-2 border-[#c8f23c] bg-[#c8f23c]/20 px-4 py-3 text-sm text-[#182704]">
              Password updated. Redirecting you to log in…
            </div>
          ) : !ready ? (
            <p className="mt-2 text-sm text-[#595e66]">Verifying your reset link…</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#595e66]">
                Choose a new password for your account.
              </p>
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-bold text-[#10141b]">New password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full border-2 border-[#10141b]/20 bg-[#f5f3ee] px-4 py-3 text-sm text-[#10141b] outline-none transition-colors focus:border-[#1a54f0]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#10141b]">Confirm new password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
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
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
