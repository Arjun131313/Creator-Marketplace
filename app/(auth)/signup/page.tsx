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
    <div className="flex min-h-screen items-center justify-center bg-[#f1f3f7] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-display text-2xl font-extrabold text-[#0d1117]">
          RealReach.
        </Link>

        <div className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] p-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#0d1117]">Sign up</h1>
          <p className="mt-2 text-sm text-[#5b6472]">
            Create a Brand or Creator account.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer border p-4 text-center transition-colors ${
                  role === "brand" ? "border-[#16255c] bg-[#16255c]/5" : "border-[#0d1117]/20 hover:border-[#0d1117]/40"
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
                <div className={role === "brand" ? "font-bold text-[#0d1117]" : "text-[#5b6472]"}>
                  Brand
                </div>
              </label>
              <label
                className={`cursor-pointer border p-4 text-center transition-colors ${
                  role === "creator" ? "border-[#16255c] bg-[#16255c]/5" : "border-[#0d1117]/20 hover:border-[#0d1117]/40"
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
                <div className={role === "creator" ? "font-bold text-[#0d1117]" : "text-[#5b6472]"}>
                  Creator
                </div>
              </label>
            </div>

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
                <span className="text-sm font-bold text-[#0d1117]">Password</span>
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#5b6472]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#16255c] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
