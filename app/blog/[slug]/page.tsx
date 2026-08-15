import Link from "next/link"
import { notFound } from "next/navigation"
import PublicNav from "@/components/public-nav"
import { BLOG_POSTS, getBlogPost } from "@/lib/blog"

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <Link href="/blog" className="text-sm font-bold text-[#1a54f0] hover:underline">
          ← Back to Resources
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="bg-[#c8f23c] px-2.5 py-1 text-[11px] font-bold uppercase text-[#182704]">{post.audience}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-[#8b8f96]">
            {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {post.readMinutes} min read
          </span>
        </div>

        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[#595e66]">{post.excerpt}</p>

        <div className="mt-10 space-y-10">
          {post.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-display text-2xl font-extrabold">{section.heading}</h2>
              <div className="mt-3 space-y-4">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-7 text-[#10141b]">{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 border-2 border-[#10141b] bg-white p-8 text-center">
          <h2 className="font-display text-2xl font-extrabold">Ready to try it yourself?</h2>
          <p className="mx-auto mt-2 max-w-md text-[#595e66]">Post a brief or build a creator profile in a few minutes.</p>
          <Link
            href="/signup"
            className="mt-6 inline-block border-2 border-[#10141b] bg-[#1a54f0] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Get started free
          </Link>
        </div>
      </main>
    </div>
  )
}
