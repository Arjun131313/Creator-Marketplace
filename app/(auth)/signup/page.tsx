"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
    <div className="flex min-h-screen items-center justify-center bg-[#18140f] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-serif text-2xl text-[#f5f1e8]">
          Real<em className="not-italic italic text-[#e8a37c]">Reach</em>
        </Link>

        <div className="paper-card rounded-sm p-10">
          <h1 className="font-serif text-3xl font-medium text-[#18140f]">Sign up</h1>
          <p className="mt-2 text-sm text-[#6b6153]">
            Create a Brand or Creator account.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-sm border p-4 text-center transition ${
                  role === "brand" ? "border-[#c1440e] bg-[#c1440e]/5" : "border-[#18140f]/15 hover:border-[#18140f]/30"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="brand"
                  checked={role === "brand"}
                  onChange={() => setRole("brand")}
                  className="sr-only"
                />
                <div className={role === "brand" ? "font-semibold text-[#18140f]" : "text-[#6b6153]"}>
                  Brand
                </div>
              </label>
              <label
                className={`cursor-pointer rounded-sm border p-4 text-center transition ${
                  role === "creator" ? "border-[#c1440e] bg-[#c1440e]/5" : "border-[#18140f]/15 hover:border-[#18140f]/30"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="creator"
                  checked={role === "creator"}
                  onChange={() => setRole("creator")}
                  className="sr-only"
                />
                <div className={role === "creator" ? "font-semibold text-[#18140f]" : "text-[#6b6153]"}>
                  Creator
                </div>
              </label>
            </div>

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
                <span className="text-sm font-medium text-[#3a332a]">Password</span>
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6b6153]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#c1440e] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
