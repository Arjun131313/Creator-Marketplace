import Link from "next/link"
import MessagesNavLink from "@/components/messages-nav-link"

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f3f7] text-[#0d1117]">
      <header className="sticky top-0 z-40 border-b border-[#0d1117]/[0.07] bg-[#f1f3f7]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#16255c]">
              Brand Portal
            </p>
            <Link href="/brand/dashboard" className="font-display text-xl font-extrabold text-[#0d1117] transition hover:text-[#16255c]">
              RealReach.
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.06em]">
            <Link
              className="border border-[#0d1117]/[0.12] px-4 py-2 text-[#0d1117] transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
              href="/brand/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="border border-[#0d1117]/[0.12] px-4 py-2 text-[#0d1117] transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
              href="/brand/jobs"
            >
              Jobs
            </Link>
            <Link
              className="border border-[#0d1117]/[0.12] px-4 py-2 text-[#0d1117] transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
              href="/brand/events"
            >
              Events
            </Link>
            <Link
              className="border border-[#0d1117]/[0.12] px-4 py-2 text-[#0d1117] transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
              href="/creators"
            >
              Browse creators
            </Link>
            <MessagesNavLink />
            <Link
              className="border border-[#0d1117]/[0.12] px-4 py-2 text-[#0d1117] transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
              href="/brand/billing"
            >
              Billing
            </Link>
            <Link
              className="rounded-[8px] bg-[#16255c] px-4 py-2 text-white transition-opacity hover:opacity-90"
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
