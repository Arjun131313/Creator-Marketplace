import Link from "next/link"
import MessagesNavLink from "@/components/messages-nav-link"

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              Brand Portal
            </p>
            <Link href="/brand/dashboard" className="text-xl font-semibold text-white hover:text-violet-200 transition">
              CreatorHub
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
              href="/brand/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
              href="/brand/jobs"
            >
              Jobs
            </Link>
            <Link
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
              href="/creators"
            >
              Browse creators
            </Link>
            <MessagesNavLink />
            <Link
              className="rounded-full bg-violet-600 px-4 py-2 text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
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
