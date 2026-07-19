// Seeds sample creator accounts + profiles so the marketplace isn't empty for
// ad traffic. Safe to re-run: existing seed accounts are looked up by email
// and their profile is upserted rather than duplicated.
//
// Usage:
//   node seed-creators.js
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
// (already present in this project). Uses the Supabase Admin API, not raw SQL,
// because profiles.id is a foreign key into Supabase's own auth.users table —
// a profile row can't exist without a real auth user behind it.

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// One shared password for seed accounts — these are sample/demo profiles, not
// real people, but change this if you ever expose seed credentials publicly.
const SEED_PASSWORD = 'CreatorHub-Seed-2026!'

const CREATORS = [
  {
    email: 'seed.rae.holloway@creatorhub-demo.test',
    display_name: 'Rae Holloway',
    niche: 'Beauty',
    bio: 'Beauty and skincare creator focused on honest, unsponsored-feeling product reviews. 3 years working with DTC brands.',
    platform_stats: {
      instagram: { followers: 84000, username: 'rae.holloway' },
      tiktok: { followers: 156000, username: '@raeholloway' },
      snapchat: null,
    },
    packages: [
      { name: 'Basic', description: 'One Instagram Reel, unpaid partnership disclosure', price: 250 },
      { name: 'Standard', description: 'One Reel + 3 Story frames, usage rights included', price: 450 },
      { name: 'Premium', description: 'Reel + Stories + static feed post, 30-day usage rights', price: 800 },
    ],
    content_types: ['Sponsored posts', 'Product reviews', 'Reels'],
    available: true,
  },
  {
    email: 'seed.priya.anand@creatorhub-demo.test',
    display_name: 'Priya Anand',
    niche: 'Fitness',
    bio: 'Strength training coach turned content creator. I make gym content that actually shows the reps, not just the highlight clips.',
    platform_stats: {
      instagram: { followers: 42000, username: 'priya.lifts' },
      tiktok: { followers: 210000, username: '@priyalifts' },
      snapchat: null,
    },
    packages: [
      { name: 'Basic', description: 'One TikTok video, brand mention', price: 300 },
      { name: 'Standard', description: 'One TikTok + one Instagram Reel', price: 550 },
      { name: 'Premium', description: '3-video series across TikTok and Instagram', price: 1200 },
    ],
    content_types: ['UGC videos', 'Product reviews', 'Reels'],
    available: true,
  },
  {
    email: 'seed.callum.reid@creatorhub-demo.test',
    display_name: 'Callum Reid',
    niche: 'Tech',
    bio: 'Unboxing and honest first-impressions content for gadgets and outdoor gear. I turn down products I wouldn’t actually use.',
    platform_stats: {
      instagram: { followers: 31000, username: 'callum.reid' },
      tiktok: { followers: 98000, username: '@callumreid' },
      snapchat: null,
    },
    packages: [
      { name: 'Basic', description: 'One TikTok unboxing video', price: 350 },
      { name: 'Standard', description: 'TikTok video + Instagram carousel', price: 600 },
      { name: 'Premium', description: 'Full review series + affiliate link setup', price: 1100 },
    ],
    content_types: ['Product reviews', 'UGC videos', 'Brand partnerships'],
    available: true,
  },
  {
    email: 'seed.mila.chen@creatorhub-demo.test',
    display_name: 'Mila Chen',
    niche: 'Food',
    bio: 'Home-cooking and recipe-recreation creator. Known for turning restaurant dishes into approachable recipes on camera.',
    platform_stats: {
      instagram: { followers: 67000, username: 'mila.cooks' },
      tiktok: { followers: 340000, username: '@milacooks' },
      snapchat: { followers: 12000, username: 'milacooks' },
    },
    packages: [
      { name: 'Basic', description: 'One recipe video featuring your product', price: 400 },
      { name: 'Standard', description: 'Recipe video + Stories + recipe card graphic', price: 700 },
      { name: 'Premium', description: '3-part recipe series, cross-posted to all platforms', price: 1500 },
    ],
    content_types: ['Sponsored posts', 'UGC videos', 'Reels', 'Stories'],
    available: true,
  },
  {
    email: 'seed.noah.reed@creatorhub-demo.test',
    display_name: 'Noah Reed',
    niche: 'Travel',
    bio: 'Slow-travel content — fewer landmarks, more real days. Working with hotels, tourism boards, and gear brands.',
    platform_stats: {
      instagram: { followers: 120000, username: 'noah.reed' },
      tiktok: { followers: 54000, username: '@noahreed' },
      snapchat: null,
    },
    packages: [
      { name: 'Basic', description: 'One Instagram carousel post', price: 500 },
      { name: 'Standard', description: 'Carousel + Reel + Stories from a single trip', price: 950 },
      { name: 'Premium', description: 'Multi-day content package with usage rights', price: 2000 },
    ],
    content_types: ['Brand partnerships', 'Sponsored posts', 'Reels'],
    available: false,
  },
  {
    email: 'seed.jordan.blake@creatorhub-demo.test',
    display_name: 'Jordan Blake',
    niche: 'Fashion',
    bio: 'Streetwear and thrifted-fit content. I work with brands who want styling that doesn’t look like an ad.',
    platform_stats: {
      instagram: { followers: 95000, username: 'jordan.blake' },
      tiktok: { followers: 187000, username: '@jordanblake' },
      snapchat: null,
    },
    packages: [
      { name: 'Basic', description: 'One styled outfit post', price: 300 },
      { name: 'Standard', description: 'Outfit post + try-on haul Reel', price: 600 },
      { name: 'Premium', description: 'Full lookbook series, 4 outfits', price: 1400 },
    ],
    content_types: ['Sponsored posts', 'Reels', 'UGC videos'],
    available: true,
  },
]

async function findExistingUserByEmail(email) {
  // Admin API has no direct get-by-email, so page through listUsers.
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find((u) => u.email === email)
    if (match) return match
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function seedCreator(creator) {
  const { email, ...profileFields } = creator

  let userId
  const existing = await findExistingUserByEmail(email)

  if (existing) {
    userId = existing.id
    console.log(`- ${creator.display_name}: auth user already exists, reusing`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'creator' },
    })
    if (error) throw error
    userId = data.user.id
    console.log(`- ${creator.display_name}: created auth user`)
  }

  const { error: upsertError } = await admin
    .from('profiles')
    .upsert({ id: userId, role: 'creator', ...profileFields })

  if (upsertError) throw upsertError
  console.log(`  ✓ profile upserted`)
}

async function main() {
  console.log(`Seeding ${CREATORS.length} sample creators...\n`)
  let ok = 0
  let failed = 0

  for (const creator of CREATORS) {
    try {
      await seedCreator(creator)
      ok += 1
    } catch (err) {
      failed += 1
      console.error(`  ✗ ${creator.display_name} failed:`, err.message ?? err)
    }
  }

  console.log(`\nDone. ${ok} succeeded, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main()
