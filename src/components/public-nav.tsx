"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

type MenuItem = {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function BriefIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function CampaignIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function AcademyIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443" />
    </svg>
  )
}

function OverviewIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

function EventsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function MessagesMenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 011.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
}

const BRAND_MENU: MenuItem[] = [
  {
    href: "/for-brands",
    title: "Why Brands Choose Us",
    description: "Escrow protection, real creator numbers, plans from £49.99",
    icon: <OverviewIcon />,
  },
  {
    href: "/creators",
    title: "Browse Creators",
    description: "Filter UK creators by niche, platform, and price",
    icon: <SearchIcon />,
  },
  {
    href: "/signup",
    title: "Post a Brief",
    description: "Set a fixed fee, get matched with creators",
    icon: <BriefIcon />,
  },
  {
    href: "/features/messages",
    title: "Messages",
    description: "Every conversation and its escrow status in one thread",
    icon: <MessagesMenuIcon />,
  },
  {
    href: "/brand/events/new",
    title: "Host an Event",
    description: "Run a launch or press day and pick who attends",
    icon: <EventsIcon />,
  },
]

const CREATOR_MENU: MenuItem[] = [
  {
    href: "/for-creators",
    title: "Why Creators Choose Us",
    description: "No follower minimum, paid automatically, no chasing",
    icon: <OverviewIcon />,
  },
  {
    href: "/campaigns",
    title: "Browse Campaigns",
    description: "Open briefs with a fee attached — apply directly",
    icon: <CampaignIcon />,
  },
  {
    href: "/academy",
    title: "Creator Academy",
    description: "Learn from creators who've done it, or teach your own lesson",
    icon: <AcademyIcon />,
  },
  {
    href: "/events",
    title: "Upcoming Events",
    description: "Brand launches and press days near you — apply to attend",
    icon: <EventsIcon />,
  },
]

function NavDropdown({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function handleLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
          open ? "text-[#10141b]" : "text-[#595e66] hover:text-[#10141b]"
        }`}
      >
        {label}
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 top-full w-80 border-2 border-[#10141b] bg-white pt-1 shadow-[6px_6px_0_#10141b]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 border-t-2 border-[#10141b]/10 p-4 transition-colors first:border-t-0 hover:bg-[#eae8e1]/40"
            >
              <span className="mt-0.5 text-[#1a54f0]">{item.icon}</span>
              <span>
                <span className="block font-display text-sm font-extrabold text-[#10141b]">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-[#595e66]">{item.description}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

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

  return (
    <header className="sticky top-0 z-50 border-b border-[#10141b]/10 bg-[#f5f3ee]/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-extrabold tracking-tight text-[#10141b]">
            RealReach.
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
              pathname === "/" ? "text-[#10141b]" : "text-[#595e66] hover:text-[#10141b]"
            }`}
          >
            Home
          </Link>
          <NavDropdown label="For Brands" items={BRAND_MENU} />
          <NavDropdown label="For Creators" items={CREATOR_MENU} />
          <Link
            href="/how-it-works"
            className={`px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
              pathname === "/how-it-works" ? "text-[#10141b]" : "text-[#595e66] hover:text-[#10141b]"
            }`}
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className={`px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
              pathname === "/pricing" ? "text-[#10141b]" : "text-[#595e66] hover:text-[#10141b]"
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className={`px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
              pathname.startsWith("/blog") ? "text-[#10141b]" : "text-[#595e66] hover:text-[#10141b]"
            }`}
          >
            Resources
          </Link>
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
