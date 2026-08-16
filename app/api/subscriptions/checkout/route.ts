import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"
import { getPlan } from "@/lib/plans"

// Starts a Stripe Checkout Session in subscription mode for a brand plan.
//
// Prices are sent inline as `price_data` rather than referencing pre-created
// Stripe Price IDs, so the tiers in src/lib/plans.ts are the only place a price
// is defined — there's no dashboard setup to keep in sync, and no way for the
// page to advertise one number while Stripe charges another.
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

  const planId = (body as Record<string, unknown>)?.plan
  if (typeof planId !== "string") {
    return NextResponse.json({ error: "Missing plan" }, { status: 400 })
  }

  const plan = getPlan(planId)
  if (!plan || !plan.selfServe || plan.priceInPence === null) {
    return NextResponse.json(
      { error: "That plan isn't available to buy online. Get in touch and we'll set it up." },
      { status: 400 },
    )
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,role,display_name,stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  if (profile.role !== "brand") {
    return NextResponse.json(
      { error: "Only brand accounts subscribe — creators never pay to use RealReach." },
      { status: 403 },
    )
  }

  // Reuse the brand's Stripe customer so upgrades and downgrades land on one
  // record rather than creating a new customer per checkout.
  let customerId = profile.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: profile.display_name ?? undefined,
      metadata: { profile_id: profile.id },
    })
    customerId = customer.id
    await adminClient
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", profile.id)
  }

  const origin =
    request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: plan.priceInPence,
          recurring: { interval: "month" },
          product_data: {
            name: `RealReach ${plan.name}`,
            description: `${plan.hires} per month. Unlimited briefs, messaging, and escrow.`,
          },
        },
      },
    ],
    // Mirrored onto the subscription so the webhook knows which tier was bought
    // without having to reverse-engineer it from the price.
    subscription_data: {
      metadata: { profile_id: profile.id, plan: plan.id },
    },
    metadata: { type: "subscription", profile_id: profile.id, plan: plan.id },
    success_url: `${origin}/brand/billing?subscribed=1`,
    cancel_url: `${origin}/pricing?cancelled=1`,
  })

  return NextResponse.json({ url: session.url })
}
