export type CreatorTier = {
  label: string
  className: string
}

// Derived entirely from real review data already on hand — never fabricated,
// since it's shown to brands as a trust signal.
export function getCreatorTier(reviewCount: number, avgRating: number | null): CreatorTier {
  if (reviewCount === 0) {
    return { label: "New Creator", className: "bg-[#18140f]/5 text-[#6b6153]" }
  }
  if (reviewCount >= 5 && (avgRating ?? 0) >= 4.5) {
    return { label: "Top Rated", className: "bg-[#c1440e]/10 text-[#c1440e]" }
  }
  return { label: "Rising Talent", className: "bg-amber-500/10 text-amber-700" }
}
