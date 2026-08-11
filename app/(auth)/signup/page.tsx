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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center font-display text-2xl font-extrabold text-[#10141b]">
          RealReach.
        </Link>

        <div className="border-2 border-[#10141b] bg-white p-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#10141b]">Sign up</h1>
          <p className="mt-2 text-sm text-[#595e66]">
            Create a Brand or Creator account.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer border-2 p-4 text-center transition-colors ${
                  role === "brand" ? "border-[#1a54f0] bg-[#1a54f0]/5" : "border-[#10141b]/20 hover:border-[#10141b]/40"
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
                <div className={role === "brand" ? "font-bold text-[#10141b]" : "text-[#595e66]"}>
                  Brand
                </div>
              </label>
              <label
                className={`cursor-pointer border-2 p-4 text-center transition-colors ${
                  role === "creator" ? "border-[#1a54f0] bg-[#1a54f0]/5" : "border-[#10141b]/20 hover:border-[#10141b]/40"
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
                <div className={role === "creator" ? "font-bold text-[#10141b]" : "text-[#595e66]"}>
                  Creator
                </div>
              </label>
            </div>

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
                <span className="text-sm font-bold text-[#10141b]">Password</span>
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#595e66]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#1a54f0] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
