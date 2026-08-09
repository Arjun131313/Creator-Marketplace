import Link from "next/link"
import MessagesNavLink from "@/components/messages-nav-link"

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#18140f]">
      <header className="sticky top-0 z-40 border-b border-[#18140f]/10 bg-[#f5f1e8]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">
              Brand Portal
            </p>
            <Link href="/brand/dashboard" className="font-serif text-xl text-[#18140f] transition hover:text-[#c1440e]">
              Creator<em className="not-italic italic text-[#c1440e]">Hub</em>
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link
              className="rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
              href="/brand/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
              href="/brand/jobs"
            >
              Jobs
            </Link>
            <Link
              className="rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
              href="/creators"
            >
              Browse creators
            </Link>
            <MessagesNavLink />
            <Link
              className="rounded-[2px] bg-[#c1440e] px-4 py-2 text-[#fef8f2] transition hover:bg-[#a23a0c]"
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
