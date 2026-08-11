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
      className="relative border-2 border-[#10141b] px-4 py-2 text-[#10141b] transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee]"
    >
      Messages
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#ff534b] px-1.5 text-[10px] font-extrabold text-white">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
