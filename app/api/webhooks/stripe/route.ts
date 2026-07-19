import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"

// Stripe webhook endpoint. Register this URL (https://<your-domain>/api/webhooks/stripe)
// in the Stripe Dashboard once deployed, and set STRIPE_WEBHOOK_SECRET to the signing
// secret it gives you. Payment status in the database is driven entirely by these
// events rather than by the request that initiated a checkout/capture/refund, so the
// DB stays in sync even if a client request fails after Stripe has already acted.
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  const adminClient = createAdminClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const paymentId = session.metadata?.payment_id
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id

      if (paymentId && paymentIntentId) {
        await adminClient
          .from("payments")
          .update({ stripe_payment_intent_id: paymentIntentId, status: "held" })
          .eq("id", paymentId)
      }
      break
    }

    case "payment_intent.canceled": {
      const intent = event.data.object as Stripe.PaymentIntent
      await adminClient
        .from("payments")
        .update({ status: "refunded" })
        .eq("stripe_payment_intent_id", intent.id)
      break
    }

    case "payment_intent.succeeded": {
      // Fires after a manual capture (our escrow release). Mark released, then
      // transfer the creator's share if they've completed Stripe Connect onboarding.
      const intent = event.data.object as Stripe.PaymentIntent

      const { data: payment } = await adminClient
        .from("payments")
        .update({ status: "released" })
        .eq("stripe_payment_intent_id", intent.id)
        .select("id,creator_id,amount,platform_fee,currency")
        .maybeSingle()

      if (payment) {
        const { data: creatorProfile } = await adminClient
          .from("profiles")
          .select("stripe_account_id")
          .eq("id", payment.creator_id)
          .maybeSingle()

        if (creatorProfile?.stripe_account_id) {
          const payoutAmount = Math.round((payment.amount - (payment.platform_fee ?? 0)) * 100)
          try {
            await stripe.transfers.create({
              amount: payoutAmount,
              currency: payment.currency,
              destination: creatorProfile.stripe_account_id,
              source_transaction:
                typeof intent.latest_charge === "string" ? intent.latest_charge : undefined,
            })
          } catch (err) {
            // Don't fail the webhook (Stripe will retry the whole event) if the
            // transfer fails — log it for manual follow-up instead.
            console.error(`Failed to transfer payout for payment ${payment.id}:`, err)
          }
        } else {
          console.warn(
            `Payment ${payment.id} released but creator ${payment.creator_id} has no connected Stripe account yet — payout not sent.`,
          )
        }
      }
      break
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id

      if (paymentIntentId) {
        await adminClient
          .from("payments")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", paymentIntentId)
      }
      break
    }

    case "account.updated": {
      // Tracks Stripe Connect onboarding progress for creators. There's no column
      // for this yet — add e.g. `stripe_onboarding_complete boolean` to profiles
      // via a migration if you want to gate UI (like "you can now be paid out") on it.
      const account = event.data.object as Stripe.Account
      console.log(
        `Stripe account ${account.id} updated — charges_enabled=${account.charges_enabled}, payouts_enabled=${account.payouts_enabled}`,
      )
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
