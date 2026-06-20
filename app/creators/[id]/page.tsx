"use client"

import React, { useState } from "react"

const platformData = [
  { name: "Instagram", followers: "245k", icon: "📷" },
  { name: "TikTok", followers: "1.2M", icon: "🎵" },
  { name: "YouTube", followers: "540k", icon: "▶️" },
]

const packages = [
  {
    name: "Basic",
    price: "£450",
    description: "Perfect for single content piece",
    deliverables: ["1 Video deliverable", "2 revisions", "7-day turnaround", "1080p quality"],
  },
  {
    name: "Standard",
    price: "£900",
    description: "Best for most brands",
    deliverables: ["3 Video deliverables", "Unlimited revisions", "5-day turnaround", "4K quality", "Usage rights included"],
    featured: true,
  },
  {
    name: "Premium",
    price: "£1,800",
    description: "Full campaign production",
    deliverables: ["5 Video deliverables", "Unlimited revisions", "3-day turnaround", "4K quality", "Full usage rights", "Dedicated account manager"],
  },
]

const reviews = [
  {
    author: "Sarah Chen",
    rating: 5,
    date: "2 weeks ago",
    comment: "Exceptional quality and professionalism. Delivered amazing content that exceeded our expectations.",
  },
  {
    author: "James Mitchell",
    rating: 5,
    date: "1 month ago",
    comment: "Great communication throughout the process. The final deliverables were perfect for our campaign.",
  },
  {
    author: "Emma Rodriguez",
    rating: 4,
    date: "6 weeks ago",
    comment: "Very talented creator. Quick turnaround and willing to make revisions. Highly recommend.",
  },
]

const portfolio = Array(6).fill(null)

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = (React as any).use(params) as { id: string }
  const [selectedPackage, setSelectedPackage] = useState("Standard")

  return (
    <div className="min-h-screen bg-[#070b1b] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/creators" className="flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200">
            ← Back to creators
          </a>
          <a href="/" className="text-xl font-semibold tracking-tight text-white">CreatorHub</a>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:gap-12">
        <div className="flex-1 space-y-12">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:gap-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-violet-500/15 text-5xl font-semibold text-violet-200">
                AM
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-semibold text-white">Ava Morgan</h1>
                  <p className="mt-2 text-lg text-violet-300">UGC & Lifestyle Creator</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                  <span>📍 London, UK</span>
                  <span>⏱️ Responds in 2 hours</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">★★★★★</span>
                    <span className="text-slate-400">4.9/5</span>
                  </div>
                  <span className="text-slate-400">127 reviews</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-white">Platforms</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {platformData.map((platform) => (
                <div key={platform.name} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                  <p className="text-3xl">{platform.icon}</p>
                  <p className="mt-3 font-semibold text-white">{platform.name}</p>
                  <p className="mt-2 text-lg font-bold text-violet-300">{platform.followers}</p>
                  <p className="text-xs text-slate-400">followers</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-white">About</h2>
            <p className="mt-4 leading-7 text-slate-300">
              I'm a passionate UGC and lifestyle creator with 5+ years of experience creating authentic, engaging content for brands. I specialize in product demonstrations, testimonials, and lifestyle content that resonates with diverse audiences. My content has helped brands achieve 3x+ engagement rates on average.
            </p>
            <p className="mt-4 leading-7 text-slate-300">
              I'm committed to delivering high-quality, professional content that aligns with your brand vision. Let's create something amazing together!
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-white">Stats</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {[
                { label: "Engagement Rate", value: "8.5%" },
                { label: "Avg Views", value: "125k" },
                { label: "Completed Jobs", value: "340+" },
                { label: "Repeat Clients", value: "89%" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-center">
                  <p className="text-3xl font-bold text-violet-300">{stat.value}</p>
                  <p className="mt-2 text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-white">Packages</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`rounded-3xl border p-8 transition ${
                    pkg.featured
                      ? "border-violet-500/50 bg-violet-500/10 shadow-xl shadow-violet-600/20"
                      : "border-white/10 bg-slate-900/80"
                  }`}
                >
                  {pkg.featured && (
                    <div className="mb-4 inline-block rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-white">{pkg.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{pkg.description}</p>
                  <p className="mt-4 text-3xl font-bold text-white">{pkg.price}</p>
                  <ul className="mt-6 space-y-3">
                    {pkg.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="mt-1 text-violet-300">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setSelectedPackage(pkg.name)}
                    className={`mt-6 w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                      selectedPackage === pkg.name
                        ? "bg-violet-500 text-white"
                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-white">Portfolio</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((_, idx) => (
                <div key={idx} className="aspect-video overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-violet-950">
                  <div className="flex h-full items-center justify-center text-slate-500">
                    <p className="text-lg">Portfolio Item {idx + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-white">Reviews</h2>
            <div className="mt-8 space-y-6">
              {reviews.map((review, idx) => (
                <div key={idx} className="border-b border-white/10 pb-6 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{review.author}</p>
                      <p className="text-xs text-slate-400">{review.date}</p>
                    </div>
                    <div className="flex gap-1 text-yellow-400">
                      {Array(review.rating)
                        .fill(null)
                        .map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                    </div>
                  </div>
                  <p className="mt-3 leading-6 text-slate-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:w-80">
          <div className="sticky top-24 space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
            <div>
              <p className="text-sm font-medium text-slate-400">Selected package</p>
              <p className="mt-2 text-2xl font-bold text-white">{selectedPackage}</p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <button className="w-full rounded-full bg-violet-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400">
                Hire me
              </button>
              <button className="mt-3 w-full rounded-full border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10">
                Contact creator
              </button>
            </div>

            <div className="border-t border-white/10 space-y-4 pt-6 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Response time</span>
                <span className="text-white">2 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Typical turnaround</span>
                <span className="text-white">3-7 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Member since</span>
                <span className="text-white">Jan 2021</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
