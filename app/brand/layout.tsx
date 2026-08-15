import Link from "next/link"
import MessagesNavLink from "@/components/messages-nav-link"

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <header className="sticky top-0 z-40 border-b-2 border-[#10141b] bg-[#f5f3ee]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1a54f0]">
              Brand Portal
            </p>
            <Link href="/brand/dashboard" className="font-display text-xl font-extrabold text-[#10141b] transition hover:text-[#1a54f0]">
              RealReach.
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.06em]">
            <Link
              className="border-2 border-[#10141b] px-4 py-2 text-[#10141b] transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee]"
              href="/brand/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="border-2 border-[#10141b] px-4 py-2 text-[#10141b] transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee]"
              href="/brand/jobs"
            >
              Jobs
            </Link>
            <Link
              className="border-2 border-[#10141b] px-4 py-2 text-[#10141b] transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee]"
              href="/brand/events"
            >
              Events
            </Link>
            <Link
              className="border-2 border-[#10141b] px-4 py-2 text-[#10141b] transition-colors hover:bg-[#10141b] hover:text-[#f5f3ee]"
              href="/creators"
            >
              Browse creators
            </Link>
            <MessagesNavLink />
            <Link
              className="border-2 border-[#10141b] bg-[#1a54f0] px-4 py-2 text-white transition-opacity hover:opacity-90"
              href="/brand/jobs/new"
            >
              Post a job
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
