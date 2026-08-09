import Link from "next/link"
import MessagesNavLink from "@/components/messages-nav-link"

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#18140f]">
      <header className="sticky top-0 z-40 border-b border-[#18140f]/10 bg-[#f5f1e8]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">
              Creator Portal
            </p>
            <Link href="/creator/dashboard" className="font-serif text-xl text-[#18140f] transition hover:text-[#c1440e]">
              Real<em className="not-italic italic text-[#c1440e]">Reach</em>
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link
              className="rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
              href="/creator/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
              href="/creator/jobs"
            >
              Browse jobs
            </Link>
            <Link
              className="rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
              href="/creator/applications"
            >
              Applications
            </Link>
            <Link
              className="rounded-[2px] border border-[#c1440e]/30 bg-[#c1440e]/10 px-4 py-2 text-[#c1440e] transition hover:bg-[#c1440e]/20"
              href="/creator/profile/setup"
            >
              Edit profile
            </Link>
            <MessagesNavLink />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
