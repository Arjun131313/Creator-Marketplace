import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { stripe, platformFeeForAmount } from "@/lib/stripe"

// Creates a Stripe Checkout Session for buying an academy lesson. Unlike job
// payments there's no escrow hold — this is instant digital delivery, so the
// PaymentIntent captures automatically (no capture_method override). The
// webhook marks the purchase "paid" and transfers the teacher's share once
// payment_intent.succeeded fires.
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

  const lessonId = (body as Record<string, unknown>)?.lessonId
  if (!lessonId || typeof lessonId !== "string") {
    return NextResponse.json({ error: "Missing lessonId" }, { status: 400 })
  }

  const { data: lesson, error: lessonError } = await adminClient
    .from("academy_lessons")
    .select("id,title,price,creator_id,status")
    .eq("id", lessonId)
    .single()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  if (lesson.status !== "published") {
    return NextResponse.json({ error: "This lesson isn't available" }, { status: 400 })
  }

  if (lesson.creator_id === user.id) {
    return NextResponse.json({ error: "You can't buy your own lesson" }, { status: 400 })
  }

  const { data: existingPurchase } = await adminClient
    .from("academy_purchases")
    .select("id,status")
    .eq("lesson_id", lessonId)
    .eq("buyer_id", user.id)
    .eq("status", "paid")
    .maybeSingle()

  if (existingPurchase) {
    return NextResponse.json({ error: "You already own this lesson" }, { status: 409 })
  }

  const amountMinorUnits = Math.round(lesson.price * 100)
  const platformFee = platformFeeForAmount(amountMinorUnits) / 100

  const { data: purchase, error: insertError } = await adminClient
    .from("academy_purchases")
    .insert({
      lesson_id: lesson.id,
      buyer_id: user.id,
      teacher_id: lesson.creator_id,
      amount: lesson.price,
      currency: "gbp",
      platform_fee: platformFee,
    })
    .select("id")
    .single()

  if (insertError || !purchase) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create purchase record" },
      { status: 500 },
    )
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_intent_data: {
        metadata: {
          type: "academy",
          academy_purchase_id: purchase.id,
          lesson_id: lesson.id,
          buyer_id: user.id,
          teacher_id: lesson.creator_id,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: `RealReach Academy: ${lesson.title}` },
            unit_amount: amountMinorUnits,
          },
          quantity: 1,
        },
      ],
      metadata: { type: "academy", academy_purchase_id: purchase.id },
      success_url: `${origin}/academy/${lesson.id}?purchase=success`,
      cancel_url: `${origin}/academy/${lesson.id}?purchase=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    await adminClient.from("academy_purchases").delete().eq("id", purchase.id)
    const message = err instanceof Error ? err.message : "Failed to create checkout session"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
