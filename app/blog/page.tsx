import Link from "next/link"
import PublicNav from "@/components/public-nav"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { BLOG_POSTS } from "@/lib/blog"

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-[1400px] px-5 py-16 pb-24 md:px-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1a54f0]">Resources</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
          Notes for brands and creators.
        </h1>
        <p className="mt-3 max-w-lg text-[#595e66]">
          Practical, no-fluff writing on pricing, working together, and getting UK influencer marketing right.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="flex flex-col border-2 border-[#10141b] bg-white transition-colors hover:bg-[#eae8e1]/40"
            >
              <div className="flex items-center justify-between border-b-2 border-[#10141b]/10 p-5">
                <span className="bg-[#c8f23c] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#182704]">
                  {post.audience}
                </span>
                <span className="text-xs font-bold text-[#8b8f96]">{post.readMinutes} min read</span>
              </div>
              <div className="flex-1 p-5">
                <h2 className="font-display text-xl font-extrabold tracking-tight">{post.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#595e66]">{post.excerpt}</p>
              </div>
              <div className="border-t-2 border-[#10141b]/10 p-5 text-xs font-bold uppercase tracking-wide text-[#8b8f96]">
                {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#10141b]/10 bg-[#10141b] px-5 py-12 text-[#a8adb6]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-[#f5f3ee]">RealReach.</p>
            <p className="mt-1 text-xs">Manchester &amp; London</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/how-it-works" className="hover:text-[#f5f3ee]">How it Works</Link>
            <Link href="/pricing" className="hover:text-[#f5f3ee]">Pricing</Link>
            <Link href="/help" className="hover:text-[#f5f3ee]">Help Center</Link>
          </div>
          <p className="text-xs">© 2026 RealReach Agency. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  )
}
