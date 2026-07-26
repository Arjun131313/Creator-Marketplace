# Deploying CreatorHub

The app is verified to build cleanly (`npm run build`) and is pushed to
`github.com/Arjun131313/Creator-Marketplace`. What's left needs your own
accounts — nothing here can be done on your behalf.

## 1. Create a Vercel account

1. Go to [vercel.com/signup](https://vercel.com/signup) and sign up with your
   GitHub account (`Arjun131313`) — this auto-links your repos.
2. Click **Add New → Project**.
3. Select `Arjun131313/Creator-Marketplace` from the repo list. Vercel
   auto-detects Next.js — no config changes needed.

## 2. Set environment variables

Before clicking Deploy, add these in the Vercel project's **Environment
Variables** screen (see `.env.example` for the full list with comments):

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (keep secret — server-only) |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (once you have an account) |
| `STRIPE_WEBHOOK_SECRET` | Set up in step 4 below |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL, e.g. `https://creator-marketplace.vercel.app` |

The app works without the Stripe variables — payment routes just return a
clear error instead of crashing. Supabase variables are required for
anything to load at all.

## 3. Deploy

Click **Deploy**. Every future push to `main` auto-deploys.

## 4. Register the Stripe webhook (once you have a Stripe account)

1. Stripe dashboard → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://<your-vercel-domain>/api/webhooks/stripe`
3. Listen for: `checkout.session.completed`, `payment_intent.succeeded`,
   `payment_intent.canceled`, `charge.refunded`, `account.updated`.
4. Copy the signing secret it gives you into Vercel's `STRIPE_WEBHOOK_SECRET`.

## Known gaps at deploy time

- Terms/Privacy pages (`/terms`, `/privacy`) are drafts with `[YOUR FULL
  NAME]` and `[DATE]` placeholders — fill in and have a lawyer review before
  treating this as a real launch.
- No custom domain configured — Vercel gives you a `*.vercel.app` URL by
  default; add a domain under Project Settings → Domains if you want one.
- Facebook/Meta requires a live Privacy Policy URL to approve an ad account —
  once deployed, that's `https://<your-domain>/privacy`.
