"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function PublicNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("role,avatar_url")
          .eq("id", session.user.id)
          .single()
        const profile = data as { role: string | null; avatar_url: string | null } | null
        setUserRole(profile?.role ?? null)
        setAvatarUrl(profile?.avatar_url ?? null)
      }
      setChecked(true)
    })
  }, [])

  const dashHref =
    userRole === "brand"
      ? "/brand/dashboard"
      : userRole === "creator"
        ? "/creator/dashboard"
        : "/login"

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/creators", label: "Creators" },
    { href: "/campaigns", label: "Campaigns" },
    { href: "/how-it-works", label: "How it works" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#10141b]/10 bg-[#f5f3ee]/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-extrabold tracking-tight text-[#10141b]">
            RealReach.
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
                pathname === link.href
                  ? "text-[#10141b]"
                  : "text-[#595e66] hover:text-[#10141b]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!checked ? (
            <div className="h-8 w-8 animate-pulse bg-[#eae8e1]" />
          ) : userRole ? (
            <>
              <Link
                href="/messages"
                className="hidden text-sm font-medium text-[#595e66] transition-colors hover:text-[#10141b] sm:inline"
              >
                Inbox
              </Link>
              <Link href={dashHref}>
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden border border-[#10141b]/15 bg-[#eae8e1]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-[#595e66]">·</span>
                  )}
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden text-sm font-medium text-[#595e66] transition-colors hover:text-[#10141b] sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-[#10141b] px-4 py-2 text-sm font-bold text-[#f5f3ee] transition-opacity hover:opacity-85"
              >
                Join free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
