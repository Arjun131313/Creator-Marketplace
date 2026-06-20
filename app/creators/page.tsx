"use client"

import Link from "next/link"
import { useState } from "react"

const creators = [
  {
    id: "1",
    name: "Ava Morgan",
    niche: "Lifestyle & UGC",
    platforms: ["Instagram", "TikTok"],
    rating: 4.9,
    reviews: 127,
    price: "£450",
    followers: "1.5M",
    location: "London, UK",
  },
  {
    id: "2",
    name: "Noah Reed",
    niche: "Brand Storytelling",
    platforms: ["YouTube", "Instagram"],
    rating: 4.8,
    reviews: 94,
    price: "£700",
    followers: "2.3M",
    location: "Manchester, UK",
  },
  {
    id: "3",
    name: "Mila Chen",
    niche: "Product Photography",
    platforms: ["UGC", "Photography"],
    rating: 4.9,
    reviews: 156,
    price: "£360",
    followers: "890k",
    location: "London, UK",
  },
  {
    id: "4",
    name: "Lucas Thompson",
    niche: "Tech & Gaming",
    platforms: ["YouTube", "Twitch"],
    rating: 4.7,
    reviews: 82,
    price: "£600",
    followers: "1.8M",
    location: "Birmingham, UK",
  },
  {
    id: "5",
    name: "Sofia Martinez",
    niche: "Fashion & Beauty",
    platforms: ["Instagram", "TikTok"],
    rating: 4.8,
    reviews: 203,
    price: "£550",
    followers: "2.1M",
    location: "London, UK",
  },
  {
    id: "6",
    name: "Ethan Paul",
    niche: "Fitness & Wellness",
    platforms: ["Instagram", "YouTube"],
    rating: 4.9,
    reviews: 178,
    price: "£480",
    followers: "1.9M",
    location: "Leeds, UK",
  },
]

const platforms = ["Instagram", "TikTok", "YouTube", "UGC", "Photography", "Twitch"]
const niches = ["Lifestyle & UGC", "Brand Storytelling", "Product Photography", "Tech & Gaming", "Fashion & Beauty", "Fitness & Wellness"]
const locations = ["London, UK", "Manchester, UK", "Birmingham, UK", "Leeds, UK", "Bristol, UK"]

export default function BrowseCreatorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState([0, 1000])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.niche.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatforms = selectedPlatforms.length === 0 || 
      selectedPlatforms.some(p => creator.platforms.includes(p))
    const matchesNiches = selectedNiches.length === 0 || 
      selectedNiches.includes(creator.niche)
    const price = parseInt(creator.price.replace("£", ""))
    const matchesBudget = price >= budgetRange[0] && price <= budgetRange[1]
    const matchesLocation = selectedLocations.length === 0 || 
      selectedLocations.includes(creator.location)

    return matchesSearch && matchesPlatforms && matchesNiches && matchesBudget && matchesLocation
  })

  const toggleFilter = (list: string[], item: string, setter: (items: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item))
    } else {
      setter([...list, item])
    }
  }

  return (
    <div className="min-h-screen bg-[#070b1b] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <a href="/" className="text-xl font-semibold tracking-tight text-white">CreatorHub</a>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-80 lg:sticky lg:top-24`}>
          <div className="space-y-8 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl lg:h-fit">
            <div>
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              <button
                onClick={() => {
                  setSelectedPlatforms([])
                  setSelectedNiches([])
                  setBudgetRange([0, 1000])
                  setSelectedLocations([])
                }}
                className="mt-3 text-xs font-medium text-violet-300 hover:text-violet-200"
              >
                Reset filters
              </button>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="font-medium text-white">Platforms</h4>
              <div className="mt-4 space-y-3">
                {platforms.map((platform) => (
                  <label key={platform} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => toggleFilter(selectedPlatforms, platform, setSelectedPlatforms)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-900 text-violet-500 accent-violet-500"
                    />
                    <span className="text-sm text-slate-300">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="font-medium text-white">Niche</h4>
              <div className="mt-4 space-y-3">
                {niches.map((niche) => (
                  <label key={niche} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedNiches.includes(niche)}
                      onChange={() => toggleFilter(selectedNiches, niche, setSelectedNiches)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-900 text-violet-500 accent-violet-500"
                    />
                    <span className="text-sm text-slate-300">{niche}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="font-medium text-white">Budget Range</h4>
              <div className="mt-4 space-y-3">
                <div className="flex gap-2 text-sm text-slate-300">
                  <span>£{budgetRange[0]}</span>
                  <span>—</span>
                  <span>£{budgetRange[1]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={budgetRange[1]}
                  onChange={(e) => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="font-medium text-white">Location</h4>
              <div className="mt-4 space-y-3">
                {locations.map((location) => (
                  <label key={location} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(location)}
                      onChange={() => toggleFilter(selectedLocations, location, setSelectedLocations)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-900 text-violet-500 accent-violet-500"
                    />
                    <span className="text-sm text-slate-300">{location}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl">
              <div className="flex gap-3">
                <input
                  type="search"
                  placeholder="Search creators by name or niche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Filters
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {filteredCreators.length} creator{filteredCreators.length !== 1 ? "s" : ""} found
              </p>
              <select className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-violet-400">
                <option>Sort by rating</option>
                <option>Sort by followers</option>
                <option>Sort by price (Low to High)</option>
                <option>Sort by price (High to Low)</option>
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {filteredCreators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/creators/${creator.id}`}
                  className="group rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl transition hover:border-violet-400/50 hover:shadow-xl hover:shadow-violet-600/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-500/15 text-2xl font-semibold text-violet-200">
                      {creator.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-violet-300">{creator.name}</h3>
                      <p className="text-sm text-slate-400">{creator.niche}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white font-medium">{creator.rating}</span>
                      <span className="text-slate-400">({creator.reviews})</span>
                    </div>
                    <span className="text-violet-300 font-medium">From {creator.price}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {creator.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                    <span>{creator.followers} followers</span>
                    <span>📍 {creator.location}</span>
                  </div>

                  <button className="mt-5 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-violet-500/20 group-hover:border-violet-400/50">
                    View profile
                  </button>
                </Link>
              ))}
            </div>

            {filteredCreators.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-900/50 p-12 text-center">
                <p className="text-slate-400">No creators match your filters. Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
