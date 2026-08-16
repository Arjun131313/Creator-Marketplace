import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f1f3f7]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d1117]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c8f23c]">
              Internal
            </p>
            <Link href="/admin" className="font-display text-xl font-extrabold">
              RealReach admin
            </Link>
          </div>
          <nav className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.06em]">
            <Link
              href="/admin"
              className="border border-white/20 px-4 py-2 transition-colors hover:bg-white hover:text-[#0d1117]"
            >
              Disputes
            </Link>
            <Link
              href="/brand/dashboard"
              className="border border-white/20 px-4 py-2 transition-colors hover:bg-white hover:text-[#0d1117]"
            >
              Leave admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  )
}
