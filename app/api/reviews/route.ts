import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

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
    return NextResponse.json({ error: "Only brands can leave reviews" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { creator_id, job_id, rating, comment } = body as {
    creator_id?: string
    job_id?: string
    rating?: number
    comment?: string
  }

  if (!creator_id || !job_id || !comment?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be a whole number between 1 and 5" }, { status: 400 })
  }

  // Verify the job belongs to this brand
  const { data: job } = await adminClient
    .from("jobs")
    .select("id")
    .eq("id", job_id)
    .eq("brand_id", user.id)
    .single()

  if (!job) {
    return NextResponse.json({ error: "Job not found or does not belong to your account" }, { status: 403 })
  }

  // Verify the creator has an accepted application on this job
  const { data: application } = await adminClient
    .from("applications")
    .select("id")
    .eq("job_id", job_id)
    .eq("creator_id", creator_id)
    .eq("status", "accepted")
    .maybeSingle()

  if (!application) {
    return NextResponse.json(
      { error: "This creator does not have an accepted application on this job" },
      { status: 400 },
    )
  }

  const { data: review, error: insertError } = await adminClient
    .from("reviews")
    .insert({
      creator_id,
      brand_id: user.id,
      job_id,
      rating,
      comment: comment.trim(),
    })
    .select("id")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "You have already reviewed this job" }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ id: review.id })
}
