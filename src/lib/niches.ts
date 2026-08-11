export const NICHE_CATEGORIES = [
  { name: "Beauty", icon: "face_retouching_natural", image: "/images/niche-beauty.jpg" },
  { name: "Fashion", icon: "checkroom", image: null },
  { name: "Fitness", icon: "fitness_center", image: "/images/niche-fitness.jpg" },
  { name: "Food", icon: "restaurant", image: "/images/niche-food.jpg" },
  { name: "Travel", icon: "flight", image: "/images/niche-travel.jpg" },
  { name: "Gaming", icon: "sports_esports", image: "/images/niche-gaming.jpg" },
  { name: "Tech", icon: "devices", image: null },
  { name: "Lifestyle", icon: "self_improvement", image: null },
  { name: "Business", icon: "business_center", image: null },
  { name: "Other", icon: "apps", image: null },
] as const

export const NICHES = NICHE_CATEGORIES.map((c) => c.name)

const FALLBACK_CREATOR_IMAGE = "/images/creator-street.jpg"

// Best-effort photo for a creator card when no real avatar has been uploaded yet.
// Falls back to a generic content-creation photo for niches without a specific one.
export function getNicheImage(niche: string | null): string {
  const match = NICHE_CATEGORIES.find((c) => c.name === niche)
  return match?.image ?? FALLBACK_CREATOR_IMAGE
}
