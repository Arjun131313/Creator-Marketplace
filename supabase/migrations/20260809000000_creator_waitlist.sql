-- Pre-launch lead capture for creators (shared as a standalone link, not part
-- of full signup). No RLS policies are defined on purpose — only the
-- server-side service role (used in /api/waitlist) can read or write this
-- table, since it holds contact details that shouldn't be publicly queryable.

CREATE TABLE IF NOT EXISTS creator_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  platform text NOT NULL,
  handle text,
  followers text,
  niche text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE creator_waitlist ENABLE ROW LEVEL SECURITY;
