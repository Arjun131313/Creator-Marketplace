import Link from "next/link"

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Creator Portal</p>
            <h1 className="text-xl font-semibold text-slate-900">Creator Marketplace</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
            <Link className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:bg-slate-100" href="/creator/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:bg-slate-100" href="/creator/jobs">
              Browse jobs
            </Link>
            <Link className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:bg-slate-100" href="/creator/applications">
              My applications
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
