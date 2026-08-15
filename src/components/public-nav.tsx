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

type MenuColumn = {
  heading: string
  items: MenuItem[]
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

function EscrowIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  )
}

function StepsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}

/* Every destination below is a page that exists. Sections a bigger platform
   would carry here — managed services, case studies, partner programme,
   podcast, mobile app — are deliberately absent rather than stubbed, so no
   nav item leads somewhere that overpromises. */
const PLATFORM_COLUMNS: MenuColumn[] = [
  {
    heading: "For brands",
    items: [
      {
        href: "/creators",
        title: "Creator Marketplace",
        description: "Filter UK creators by niche, platform and rate",
        icon: <SearchIcon />,
      },
      {
        href: "/brand/jobs/new",
        title: "Post a Brief",
        description: "Set a fixed fee and get matched",
        icon: <BriefIcon />,
      },
      {
        href: "/brand/events/new",
        title: "Host an Event",
        description: "Run a launch or press day and pick who attends",
        icon: <EventsIcon />,
      },
      {
        href: "/for-brands",
        title: "Why brands choose us",
        description: "Escrow, real numbers, plans from £49.99",
        icon: <OverviewIcon />,
      },
    ],
  },
  {
    heading: "For creators",
    items: [
      {
        href: "/campaigns",
        title: "Browse Campaigns",
        description: "Open briefs with the fee shown upfront",
        icon: <CampaignIcon />,
      },
      {
        href: "/events",
        title: "Upcoming Events",
        description: "Brand launches near you — apply to attend",
        icon: <EventsIcon />,
      },
      {
        href: "/academy",
        title: "Creator Academy",
        description: "Learn from creators, or teach your own lesson",
        icon: <AcademyIcon />,
      },
      {
        href: "/for-creators",
        title: "Why creators choose us",
        description: "No follower minimum, paid automatically",
        icon: <OverviewIcon />,
      },
    ],
  },
  {
    heading: "How it works",
    items: [
      {
        href: "/features/messages",
        title: "Messages",
        description: "Conversations and escrow status in one thread",
        icon: <MessagesMenuIcon />,
      },
      {
        href: "/how-it-works",
        title: "Payments & Escrow",
        description: "Held on hire, released on approval",
        icon: <EscrowIcon />,
      },
      {
        href: "/how-it-works",
        title: "The full process",
        description: "Four steps, brief to payout",
        icon: <StepsIcon />,
      },
    ],
  },
]

const RESOURCE_ITEMS: MenuItem[] = [
  {
    href: "/blog",
    title: "Resources",
    description: "Practical writing on pricing, briefs and UK rules",
    icon: <BookIcon />,
  },
  {
    href: "/help",
    title: "Help Centre",
    description: "Answers for brands and creators",
    icon: <HelpIcon />,
  },
]

/** Shared open/close timing so menus don't flicker when moving between them. */
function useHoverMenu() {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return {
    open,
    handlers: {
      onMouseEnter: () => {
        if (timer.current) clearTimeout(timer.current)
        setOpen(true)
      },
      onMouseLeave: () => {
        timer.current = setTimeout(() => setOpen(false), 120)
      },
    },
    close: () => setOpen(false),
  }
}

function MenuLink({ item, onNavigate }: { item: MenuItem; onNavigate: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-[10px] p-3 transition-colors hover:bg-[#0d1117]/[0.04]"
    >
      <span className="mt-0.5 shrink-0 text-[#16255c] transition-colors group-hover:text-[#1d3078]">
        {item.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#0d1117]">{item.title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-[#5b6472]">{item.description}</span>
      </span>
    </Link>
  )
}

function PlatformMenu() {
  const { open, handlers, close } = useHoverMenu()

  return (
    <div {...handlers} className="static">
      <button
        className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors ${
          open ? "text-[#0d1117]" : "text-[#5b6472] hover:text-[#0d1117]"
        }`}
      >
        Platform
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full px-5">
          <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[16px] bg-white shadow-[0_6px_14px_rgba(13,17,23,0.06),0_24px_60px_rgba(13,17,23,0.14)] ring-1 ring-[#0d1117]/[0.06]">
            <div className="grid gap-x-6 gap-y-2 p-5 md:grid-cols-3">
              {PLATFORM_COLUMNS.map((column) => (
                <div key={column.heading}>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8b93a3]">
                    {column.heading}
                  </p>
                  {column.items.map((item) => (
                    <MenuLink key={item.title} item={item} onNavigate={close} />
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#0d1117]/[0.07] bg-[#f7f8fa] px-8 py-4">
              <p className="text-sm text-[#5b6472]">
                Creators join free. Brands only pay once they&apos;re hiring.
              </p>
              <Link
                href="/pricing"
                onClick={close}
                className="text-sm font-bold text-[#16255c] hover:underline"
              >
                See pricing →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ResourcesMenu() {
  const { open, handlers, close } = useHoverMenu()

  return (
    <div {...handlers} className="relative">
      <button
        className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors ${
          open ? "text-[#0d1117]" : "text-[#5b6472] hover:text-[#0d1117]"
        }`}
      >
        Resources
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 top-full w-80 pt-2">
          <div className="rounded-[14px] bg-white p-2 shadow-[0_4px_10px_rgba(13,17,23,0.06),0_16px_40px_rgba(13,17,23,0.12)] ring-1 ring-[#0d1117]/[0.06]">
            {RESOURCE_ITEMS.map((item) => (
              <MenuLink key={item.href} item={item} onNavigate={close} />
            ))}
          </div>
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
    <header className="sticky top-0 z-50 border-b border-[#0d1117]/[0.07] bg-[#f1f3f7]/90 backdrop-blur-md">
      <div className="relative mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="font-display text-xl font-extrabold tracking-tight text-[#0d1117]">
            RealReach.
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          <PlatformMenu />
          <Link
            href="/pricing"
            className={`px-3 py-2 text-sm font-semibold transition-colors ${
              pathname === "/pricing" ? "text-[#0d1117]" : "text-[#5b6472] hover:text-[#0d1117]"
            }`}
          >
            Pricing
          </Link>
          <ResourcesMenu />
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {!checked ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#0d1117]/[0.06]" />
          ) : userRole ? (
            <>
              <Link
                href="/messages"
                className="hidden text-sm font-semibold text-[#5b6472] transition-colors hover:text-[#0d1117] sm:inline"
              >
                Inbox
              </Link>
              <Link href={dashHref}>
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#e4e7ee] ring-1 ring-[#0d1117]/10">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-[#5b6472]">·</span>
                  )}
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-[#5b6472] transition-colors hover:text-[#0d1117] sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-[9px] bg-[#16255c] px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1d3078]"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
