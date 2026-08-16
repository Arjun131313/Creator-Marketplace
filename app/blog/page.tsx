import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { BLOG_POSTS } from "@/lib/blog"

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen bg-[#f1f3f7] text-[#0d1117]">
      <PublicNav />

      <main className="mx-auto max-w-[1400px] px-5 py-16 pb-24 md:px-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#16255c]">Resources</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
          Notes for brands and creators.
        </h1>
        <p className="mt-3 max-w-lg text-[#5b6472]">
          Practical, no-fluff writing on pricing, working together, and getting UK influencer marketing right.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="flex flex-col rounded-[16px] bg-white shadow-[0_1px_3px_rgba(13,17,23,0.05),0_8px_24px_rgba(13,17,23,0.06)] ring-1 ring-[#0d1117]/[0.05] transition-colors hover:bg-[#e4e7ee]/40"
            >
              <div className="flex items-center justify-between border-b border-[#0d1117]/[0.07] p-5">
                <span className="bg-[#c8f23c] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#101a3d]">
                  {post.audience}
                </span>
                <span className="text-xs font-bold text-[#8b93a3]">{post.readMinutes} min read</span>
              </div>
              <div className="flex-1 p-5">
                <h2 className="font-display text-xl font-extrabold tracking-tight">{post.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5b6472]">{post.excerpt}</p>
              </div>
              <div className="border-t border-[#0d1117]/[0.07] p-5 text-xs font-bold uppercase tracking-wide text-[#8b93a3]">
                {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#0d1117]/10 bg-[#0d1117] px-5 py-12 text-[#8891a3]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f1f3f7]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/how-it-works" className="hover:text-[#f1f3f7]">How it Works</Link>
            <Link href="/pricing" className="hover:text-[#f1f3f7]">Pricing</Link>
            <Link href="/help" className="hover:text-[#f1f3f7]">Help Center</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
