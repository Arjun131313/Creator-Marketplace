"use client"

import { useEffect, useState } from "react"
import AppHeader from "@/components/app-header"
import { supabase } from "@/lib/supabase"

/**
 * Header for the inbox, which is the one signed-in area shared by both sides of
 * the marketplace and so can't sit under the brand or creator layout.
 *
 * It resolves the viewer's role purely so "Dashboard" points somewhere useful;
 * everything else comes from AppHeader, so the inbox looks identical to the rest
 * of the signed-in app rather than being its own thing.
 */
export default function InboxHeader() {
  const [role, setRole] = useState<"brand" | "creator" | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) return

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (!mounted) return
      if (data?.role === "brand" || data?.role === "creator") setRole(data.role)
    })()

    return () => {
      mounted = false
    }
  }, [])

  const dashboard = role === "brand" ? "/brand/dashboard" : "/creator/dashboard"

  const links = [
    { label: "Dashboard", href: dashboard },
    role === "brand"
      ? { label: "Browse creators", href: "/creators" }
      : { label: "Browse briefs", href: "/campaigns" },
  ]

  return (
    // The badge would count the very messages being read, so it's suppressed here.
    <AppHeader eyebrow="Inbox" homeHref={dashboard} links={links} showMessages={false} />
  )
}
