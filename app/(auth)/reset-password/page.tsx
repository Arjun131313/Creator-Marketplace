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
    <div className="min-h-screen bg-zinc-50 text-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold">Set a new password</h1>

        {invalid ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              This reset link is invalid or has expired.
            </p>
            <p className="mt-6 text-center text-sm">
              <Link href="/forgot-password" className="font-medium text-slate-900 hover:underline">
                Request a new link
              </Link>
            </p>
          </>
        ) : success ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Password updated. Redirecting you to log in…
          </div>
        ) : !ready ? (
          <p className="mt-2 text-sm text-slate-600">Verifying your reset link…</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Choose a new password for your account.
            </p>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">New password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition focus:border-slate-400 focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Confirm new password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition focus:border-slate-400 focus:ring-2"
                />
              </label>

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
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
