import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { generateJobBrief } from "@/lib/anthropic"

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

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "brand") {
    return NextResponse.json({ error: "Only brands can draft briefs" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { title, contentType, platform, videoDuration, talkingPoints } = body as {
    title?: string
    contentType?: string
    platform?: string
    videoDuration?: string
    talkingPoints?: string
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 })
  }

  const result = await generateJobBrief({ title, contentType, platform, videoDuration, talkingPoints })

  if (!result.ok) {
    return NextResponse.json(
      { error: "AI brief drafting isn't set up yet — write the description yourself for now." },
      { status: 503 },
    )
  }

  return NextResponse.json({ description: result.description })
}
