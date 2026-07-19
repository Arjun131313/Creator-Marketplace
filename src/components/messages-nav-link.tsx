"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MessagesNavLink() {
  const [unreadCount, setUnreadCount] = useState<number>(0)

  useEffect(() => {
    let mounted = true

    async function loadUnread() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        return
      }

      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", session.user.id)
        .eq("read", false)

      if (mounted && !error && typeof count === "number") {
        setUnreadCount(count)
      }
    }

    loadUnread()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Link
      href="/messages"
      className="relative rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
    >
      Messages
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
