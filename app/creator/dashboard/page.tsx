"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CreatorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function verify() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (error || profile?.role !== "creator") {
        router.push(profile?.role === "brand" ? "/brand/dashboard" : "/login")
        return
      }

      setLoading(false)
    }

    verify()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-slate-900 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
          <p className="text-lg font-medium">Loading your creator dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold">Creator Dashboard</h1>
        <p className="mt-3 text-slate-600">
          This is your placeholder dashboard. Replace this content with your creator workflow.
        </p>
      </div>
    </div>
  )
}
