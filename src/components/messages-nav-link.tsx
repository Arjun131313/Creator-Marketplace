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
      className="relative rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-sm font-medium text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
    >
      Messages
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#c1440e] px-1.5 text-xs font-semibold text-[#fef8f2]">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
