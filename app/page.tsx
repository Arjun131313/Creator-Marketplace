const categories = [
  "Instagram",
  "TikTok",
  "YouTube",
  "UGC",
  "Photography",
  "Video Production",
]

const creators = [
  {
    name: "Ava Morgan",
    niche: "Lifestyle & UGC",
    platforms: ["Instagram", "TikTok"],
    rating: 4.9,
    price: "£450",
  },
  {
    name: "Noah Reed",
    niche: "Brand Storytelling",
    platforms: ["YouTube", "Instagram"],
    rating: 4.8,
    price: "£700",
  },
  {
    name: "Mila Chen",
    niche: "Product Photography",
    platforms: ["UGC", "Photography"],
    rating: 4.9,
    price: "£360",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070b1b] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30">
              CH
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">CreatorHub</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="/creators" className="transition hover:text-white">Browse Creators</a>
            <a href="#how-it-works" className="transition hover:text-white">How it Works</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a href="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white">
              Log in
            </a>
            <a href="/signup" className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400">
              Sign up
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16 md:px-8">
        <section className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex rounded-full bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 ring-1 ring-violet-400/20">
              Premium creator marketplace for ambitious brands
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Find the perfect creator for your brand
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Discover curated creators across Instagram, TikTok, YouTube, UGC, photography and video production — all in one premium platform.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-[0_40px_120px_-60px_rgba(89,23,235,0.45)]">
              <label className="mb-3 block text-sm font-medium text-slate-400">Search creators by niche or platform</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-slate-900 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  placeholder="e.g. TikTok fitness, product photography, UGC creator"
                  type="search"
                />
                <a href="/creators" className="inline-flex items-center justify-center rounded-3xl bg-violet-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-violet-400">
                  Search creators
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <button
                  key={category}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-violet-400 hover:bg-violet-500/15"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/10 via-slate-950 to-slate-900 p-8 shadow-2xl shadow-violet-600/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(129,140,248,0.35),_transparent_35%)]" />
            <div className="relative space-y-6">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.4em] text-slate-300">Top-rated creators</p>
                <h2 className="text-3xl font-semibold text-white">Creators on CreatorHub</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {creators.map((creator) => (
                  <div key={creator.name} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-800 text-lg font-semibold text-white">
                        {creator.name.split(" ").map((part) => part[0]).join("")}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">{creator.name}</p>
                        <p className="text-sm text-slate-400">{creator.niche}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                      {creator.platforms.map((platform) => (
                        <span key={platform} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          {platform}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-violet-300">★</span>
                        <span>{creator.rating}</span>
                      </div>
                      <div className="rounded-full bg-white/5 px-3 py-1 text-slate-200">From {creator.price}</div>
                    </div>
                    <button className="mt-5 w-full rounded-3xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500/25">
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="browse" className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.4em] text-violet-300">Featured creators</p>
            <h2 className="text-3xl font-semibold text-white">Trusted by fast-moving brands.</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {creators.map((creator) => (
              <div key={creator.name} className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/20">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-500/15 text-2xl font-semibold text-violet-200">
                    {creator.name.split(" ").map((part) => part[0]).join("")}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{creator.name}</p>
                    <p className="text-sm text-slate-400">{creator.niche}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
                  {creator.platforms.map((platform) => (
                    <span key={platform} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {platform}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-violet-300">★</span>
                    <span>{creator.rating}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">From {creator.price}</p>
                </div>
                <button className="mt-6 w-full rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-10 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-violet-300">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">A smarter way to hire creators</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-400">
              Connect with verified creators, manage applications seamlessly, and pay with confidence through CreatorHub.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Post a brief",
                description: "Share your project goals, audience, and deliverables so creators can respond with relevant proposals.",
              },
              {
                title: "Browse creators",
                description: "Explore curated creator profiles by platform, niche and budget to find the best match for your brand.",
              },
              {
                title: "Pay securely",
                description: "Complete your hire with trusted payments and protected milestones, all in one place.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-violet-500/15 text-violet-200">✓</div>
                <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950 p-10 shadow-2xl shadow-violet-700/20 md:grid-cols-3">
          {[
            { value: "200k+", label: "Creators" },
            { value: "10k+", label: "Brands" },
            { value: "£5M+", label: "Paid out" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl bg-white/5 p-6 text-center">
              <p className="text-4xl font-semibold text-white">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </section>
      </main>

      <footer id="pricing" className="border-t border-white/10 bg-slate-950/95 px-6 py-10 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-white">CreatorHub</p>
            <p className="max-w-lg text-sm leading-6 text-slate-400">Built for brands that want polished creator connections and premium campaign results.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-white">Platform</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li><a href="#browse" className="transition hover:text-white">Browse Creators</a></li>
                <li><a href="#how-it-works" className="transition hover:text-white">How it Works</a></li>
                <li><a href="#pricing" className="transition hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Support</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li><a href="#" className="transition hover:text-white">Help Center</a></li>
                <li><a href="#" className="transition hover:text-white">Terms</a></li>
                <li><a href="#" className="transition hover:text-white">Privacy</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Contact</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li>hello@creatorhub.com</li>
                <li>+44 20 7946 0958</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
