import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"

// Creates (or reuses) a Stripe Express connected account for a creator and returns
// an onboarding link. Visit the returned URL to complete identity verification and
// bank details — until that's done, Stripe will reject transfers to the account.
//
// Not yet wired to any button in the UI — call this from the creator profile/setup
// flow once you decide where "connect your payout account" should live.
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
    .select("role,stripe_account_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  if (profile.role !== "creator") {
    return NextResponse.json({ error: "Only creators can connect a payout account" }, { status: 403 })
  }

  let accountId = profile.stripe_account_id

  if (!accountId) {
    try {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      })
      accountId = account.id

      await adminClient
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create Stripe account"
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/creator/profile/setup?stripe=refresh`,
      return_url: `${origin}/creator/dashboard?stripe=connected`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create onboarding link"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
