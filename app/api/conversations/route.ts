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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const creatorId = (body as Record<string, unknown>)?.creatorId
  if (!creatorId || typeof creatorId !== "string") {
    return NextResponse.json({ error: "Missing creatorId" }, { status: 400 })
  }

  const [participant_a, participant_b] = [user.id, creatorId].sort()

  const { data: existing, error: existingError } = await adminClient
    .from("conversations")
    .select("id")
    .eq("participant_a", participant_a)
    .eq("participant_b", participant_b)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existing?.id) {
    return NextResponse.json({ conversationId: existing.id })
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("conversations")
    .insert({ participant_a, participant_b })
    .select("id")
    .single()

  if (insertError) {
    // Race condition: another request created the same conversation simultaneously
    if (insertError.code === "23505") {
      const { data: race } = await adminClient
        .from("conversations")
        .select("id")
        .eq("participant_a", participant_a)
        .eq("participant_b", participant_b)
        .single()

      if (race?.id) {
        return NextResponse.json({ conversationId: race.id })
      }
    }

    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ conversationId: inserted.id })
}
