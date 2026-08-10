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
