-- stripe_account_id already exists in production (added ad-hoc, no migration on
-- record) — IF NOT EXISTS makes this safe to run either way and brings the repo's
-- migration history back in sync with reality.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;
