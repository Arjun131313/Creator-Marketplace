import Stripe from "stripe"

// Stripe's constructor throws on an empty string, so a placeholder is used when
// STRIPE_SECRET_KEY is unset — this keeps imports (and this file's own tests) from
// crashing in environments without it configured yet. Any actual API call will
// fail loudly with a clear Stripe auth error until a real key is set in .env.local.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_not_configured")

// Platform fee taken on release, expressed in basis points (500 = 5%).
// Matches the "platform fee only on completed jobs" pricing shown on the homepage.
export const PLATFORM_FEE_BPS = 500

export function platformFeeForAmount(amountInMinorUnits: number): number {
  return Math.round((amountInMinorUnits * PLATFORM_FEE_BPS) / 10_000)
}
