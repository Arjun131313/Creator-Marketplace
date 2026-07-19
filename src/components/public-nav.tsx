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
    { href: "/creators", label: "Browse" },
    { href: "/how-it-works", label: "How it Works" },
  ]

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[#18140f]/10 bg-[#f5f1e8]/90 px-gutter py-4 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <span className="font-serif text-xl tracking-tight text-[#18140f]">
          Creator<em className="not-italic italic text-[#c1440e]">Hub</em>
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`font-label-md text-label-md transition-colors ${
              pathname === link.href
                ? "font-semibold text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {!checked ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-surface-container" />
        ) : userRole ? (
          <>
            <Link href="/messages" aria-label="Messages">
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                notifications
              </span>
            </Link>
            <Link href={dashHref}>
              <div className="w-9 h-9 rounded-full bg-primary-container overflow-hidden border border-[#18140f]/10 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-on-primary-container text-[20px]">
                    person
                  </span>
                )}
              </div>
            </Link>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-[2px] bg-primary px-5 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-[#a23a0c]"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
