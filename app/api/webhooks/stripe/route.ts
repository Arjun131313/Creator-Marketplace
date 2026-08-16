import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"
import {
  notifyCreatorHired,
  notifyLessonSold,
  notifyPaymentReleased,
  notifySubscriptionPastDue,
} from "@/lib/notifications"
import { getPlan } from "@/lib/plans"

type AdminClient = ReturnType<typeof createAdminClient>

// Marks a job "completed" once every payment tied to it has settled (released
// or refunded) — called right after a release, so at least one creator was
// actually paid. Leaves in-flight jobs (still held/pending/disputed payments)
// untouched.
async function maybeCompleteJob(adminClient: AdminClient, jobId: string) {
  const { data: outstanding } = await adminClient
    .from("payments")
    .select("id")
    .eq("job_id", jobId)
    .in("status", ["pending", "held", "disputed"])
    .limit(1)

  if (outstanding && outstanding.length > 0) return

  await adminClient
    .from("jobs")
    .update({ status: "completed" })
    .eq("id", jobId)
    .eq("status", "in_progress")
}

// Shared by both job-payment release and academy-purchase payout — transfers
// the recipient's share (amount minus platform fee) to their connected
// Stripe account, if they've finished Connect onboarding.
async function transferPayout(
  adminClient: AdminClient,
  args: {
    recipientId: string
    amount: number
    platformFee: number | null
    currency: string
    latestCharge: Stripe.PaymentIntent["latest_charge"]
    logLabel: string
  },
) {
  const { data: recipientProfile } = await adminClient
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", args.recipientId)
    .maybeSingle()

  if (!recipientProfile?.stripe_account_id) {
    console.warn(`${args.logLabel} but recipient ${args.recipientId} has no connected Stripe account yet — payout not sent.`)
    return
  }

  const payoutAmount = Math.round((args.amount - (args.platformFee ?? 0)) * 100)
  try {
    await stripe.transfers.create({
      amount: payoutAmount,
      currency: args.currency,
      destination: recipientProfile.stripe_account_id,
      source_transaction: typeof args.latestCharge === "string" ? args.latestCharge : undefined,
    })
  } catch (err) {
    console.error(`Failed to transfer payout — ${args.logLabel}:`, err)
  }
}

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
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id

      if (session.metadata?.type === "academy") {
        const purchaseId = session.metadata.academy_purchase_id
        if (purchaseId && paymentIntentId) {
          await adminClient
            .from("academy_purchases")
            .update({ stripe_payment_intent_id: paymentIntentId })
            .eq("id", purchaseId)
        }
        break
      }

      const paymentId = session.metadata?.payment_id
      if (paymentId && paymentIntentId) {
        const { data: heldPayment } = await adminClient
          .from("payments")
          .update({ stripe_payment_intent_id: paymentIntentId, status: "held" })
          .eq("id", paymentId)
          .select("job_id,brand_id,creator_id,amount")
          .maybeSingle()

        if (heldPayment) {
          const { data: hiredJob } = await adminClient
            .from("jobs")
            .select("title")
            .eq("id", heldPayment.job_id)
            .single()

          await notifyCreatorHired(adminClient, {
            creatorId: heldPayment.creator_id,
            brandId: heldPayment.brand_id,
            jobId: heldPayment.job_id,
            jobTitle: hiredJob?.title ?? "your job",
            amount: heldPayment.amount,
          })
        }
      }
      break
    }

    case "payment_intent.canceled": {
      const intent = event.data.object as Stripe.PaymentIntent
      await adminClient
        .from("payments")
        .update({ status: "refunded" })
        .eq("stripe_payment_intent_id", intent.id)
      await adminClient
        .from("academy_purchases")
        .update({ status: "refunded" })
        .eq("stripe_payment_intent_id", intent.id)
      break
    }

    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent

      if (intent.metadata?.type === "academy") {
        // Auto-captured (no manual hold step) — this is the first and only
        // "succeeded" signal, so mark paid and pay out the teacher right away.
        const { data: purchase } = await adminClient
          .from("academy_purchases")
          .update({ status: "paid" })
          .eq("stripe_payment_intent_id", intent.id)
          .select("id,lesson_id,teacher_id,amount,platform_fee,currency")
          .maybeSingle()

        if (purchase) {
          await transferPayout(adminClient, {
            recipientId: purchase.teacher_id,
            amount: purchase.amount,
            platformFee: purchase.platform_fee,
            currency: purchase.currency,
            latestCharge: intent.latest_charge,
            logLabel: `Academy purchase ${purchase.id} paid`,
          })

          const { data: lesson } = await adminClient
            .from("academy_lessons")
            .select("title")
            .eq("id", purchase.lesson_id)
            .single()

          await notifyLessonSold(adminClient, {
            teacherId: purchase.teacher_id,
            lessonTitle: lesson?.title ?? "your lesson",
            amount: purchase.amount,
            platformFee: purchase.platform_fee ?? 0,
          })
        }
        break
      }

      // Fires after a manual capture (our escrow release). Mark released, then
      // transfer the creator's share if they've completed Stripe Connect onboarding.
      const { data: payment } = await adminClient
        .from("payments")
        .update({ status: "released" })
        .eq("stripe_payment_intent_id", intent.id)
        .select("id,job_id,creator_id,amount,platform_fee,currency")
        .maybeSingle()

      if (payment) {
        await transferPayout(adminClient, {
          recipientId: payment.creator_id,
          amount: payment.amount,
          platformFee: payment.platform_fee,
          currency: payment.currency,
          latestCharge: intent.latest_charge,
          logLabel: `Payment ${payment.id} released`,
        })

        await maybeCompleteJob(adminClient, payment.job_id)

        const { data: releasedJob } = await adminClient
          .from("jobs")
          .select("title")
          .eq("id", payment.job_id)
          .single()

        await notifyPaymentReleased(adminClient, {
          creatorId: payment.creator_id,
          jobTitle: releasedJob?.title ?? "your job",
          amount: payment.amount,
          platformFee: payment.platform_fee ?? 0,
        })
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
        await adminClient
          .from("academy_purchases")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", paymentIntentId)
      }
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription

      // A deleted subscription ends entitlement outright. Otherwise Stripe's own
      // status drives it, so a failed payment (past_due) closes off hiring
      // without us tracking dunning ourselves.
      const ended = event.type === "customer.subscription.deleted"
      const planId = subscription.metadata?.plan ?? null
      const profileId = subscription.metadata?.profile_id ?? null

      // Current Stripe API versions carry the billing period on the subscription
      // item rather than the subscription itself.
      const item = subscription.items?.data?.[0]
      const toIso = (seconds: number | null | undefined) =>
        typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null

      const update = {
        stripe_subscription_id: ended ? null : subscription.id,
        plan: ended ? null : planId,
        plan_status: ended ? "canceled" : subscription.status,
        plan_period_start: toIso(item?.current_period_start),
        plan_period_end: toIso(item?.current_period_end),
      }

      // Match on the metadata profile id when Stripe sends it, and fall back to
      // the customer id so a subscription created outside our checkout (e.g.
      // from the Stripe dashboard) still lands on the right brand.
      const query = adminClient.from("profiles").update(update)
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id

      if (profileId) {
        await query.eq("id", profileId)
      } else if (customerId) {
        await query.eq("stripe_customer_id", customerId)
      }

      // A failed payment silently blocks hiring, so it's the one status change
      // the brand has to be told about.
      if (subscription.status === "past_due" || subscription.status === "unpaid") {
        let brandId: string | null = profileId
        if (!brandId && customerId) {
          const { data: byCustomer } = await adminClient
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle()
          brandId = byCustomer?.id ?? null
        }

        if (brandId) {
          await notifySubscriptionPastDue(adminClient, {
            brandId,
            planName: getPlan(planId)?.name ?? "RealReach",
          })
        }
      }
      break
    }

    case "account.updated": {
      // Tracks Stripe Connect onboarding progress for creators, so the UI can show
      // "payouts enabled" once Stripe has verified identity + bank details.
      const account = event.data.object as Stripe.Account
      const payoutsEnabled = Boolean(account.charges_enabled && account.payouts_enabled)

      await adminClient
        .from("profiles")
        .update({ stripe_payouts_enabled: payoutsEnabled })
        .eq("stripe_account_id", account.id)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
