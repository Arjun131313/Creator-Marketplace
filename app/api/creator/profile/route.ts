import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import type { PlatformStats, CreatorPackage, ContentUrl } from "@/types/database"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const adminClient = createAdminClient()

  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "creator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const {
    display_name,
    bio,
    niche,
    avatar_url,
    platform_stats,
    packages,
    content_urls,
    content_types,
    available,
  } = body as {
    display_name?: string | null
    bio?: string | null
    niche?: string | null
    avatar_url?: string | null
    platform_stats?: PlatformStats | null
    packages?: CreatorPackage[] | null
    content_urls?: ContentUrl[] | null
    content_types?: string[] | null
    available?: boolean
  }

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      display_name: display_name ?? null,
      bio: bio ?? null,
      niche: niche ?? null,
      ...(avatar_url !== undefined ? { avatar_url } : {}),
      platform_stats: platform_stats ?? null,
      packages: packages ?? null,
      content_urls: content_urls ?? null,
      content_types: content_types ?? null,
      ...(available !== undefined ? { available } : {}),
    })
    .eq("id", user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
