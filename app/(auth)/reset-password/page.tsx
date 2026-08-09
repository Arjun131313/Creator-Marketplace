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
    <div className="flex min-h-screen items-center justify-center bg-[#18140f] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-serif text-2xl text-[#f5f1e8]">
          Real<em className="not-italic italic text-[#e8a37c]">Reach</em>
        </Link>

        <div className="paper-card rounded-sm p-10">
          <h1 className="font-serif text-3xl font-medium text-[#18140f]">Set a new password</h1>

          {invalid ? (
            <>
              <p className="mt-2 text-sm text-[#6b6153]">
                This reset link is invalid or has expired.
              </p>
              <p className="mt-6 text-center text-sm">
                <Link href="/forgot-password" className="font-semibold text-[#c1440e] hover:underline">
                  Request a new link
                </Link>
              </p>
            </>
          ) : success ? (
            <div className="mt-8 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Password updated. Redirecting you to log in…
            </div>
          ) : !ready ? (
            <p className="mt-2 text-sm text-[#6b6153]">Verifying your reset link…</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#6b6153]">
                Choose a new password for your account.
              </p>
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-medium text-[#3a332a]">New password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#3a332a]">Confirm new password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-2 w-full rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
                  />
                </label>

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
