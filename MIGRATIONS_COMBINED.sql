-- Creator Marketplace Database Migrations
-- Execute this entire script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/jxdfehyciufcppxrtjez/sql/new
--
-- NOTE: The 'profiles' table is pre-existing and created by Supabase auth.
-- This migration creates only: jobs, applications, payments, submissions, disputes

-- ============================================================================
-- Migration 1: Create jobs table
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE jobs (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text          NOT NULL,
  description text          NOT NULL,
  budget      numeric(10,2) NOT NULL CHECK (budget > 0),
  currency    text          NOT NULL DEFAULT 'usd',
  status      text          NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  deadline    timestamptz,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_brand_id ON jobs(brand_id);
CREATE INDEX idx_jobs_status   ON jobs(status);

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Brands manage their own job listings
CREATE POLICY "brands_manage_own_jobs" ON jobs
  FOR ALL
  USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

-- Creators can browse open jobs
CREATE POLICY "creators_view_open_jobs" ON jobs
  FOR SELECT
  USING (status = 'open');

-- ============================================================================
-- Migration 2: Create applications table
-- ============================================================================

CREATE TABLE applications (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid          NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  creator_id    uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        text          NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  pitch         text          NOT NULL,
  proposed_rate numeric(10,2) CHECK (proposed_rate > 0),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (job_id, creator_id)
);

CREATE INDEX idx_applications_job_id     ON applications(job_id);
CREATE INDEX idx_applications_creator_id ON applications(creator_id);
CREATE INDEX idx_applications_status     ON applications(status);

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Creators manage their own applications
CREATE POLICY "creators_manage_own_applications" ON applications
  FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Brands can read applications on their jobs
CREATE POLICY "brands_view_applications_for_their_jobs" ON applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
        AND jobs.brand_id = auth.uid()
    )
  );

-- Brands can accept/reject by updating status
CREATE POLICY "brands_update_application_status" ON applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
        AND jobs.brand_id = auth.uid()
    )
  );

-- ============================================================================
-- Migration 3: Create payments table
-- ============================================================================

CREATE TABLE payments (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                   uuid          NOT NULL REFERENCES jobs(id),
  application_id           uuid          REFERENCES applications(id),
  brand_id                 uuid          NOT NULL REFERENCES profiles(id),
  creator_id               uuid          NOT NULL REFERENCES profiles(id),
  stripe_payment_intent_id text          UNIQUE,
  amount                   numeric(10,2) NOT NULL CHECK (amount > 0),
  currency                 text          NOT NULL DEFAULT 'usd',
  status                   text          NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  platform_fee             numeric(10,2) CHECK (platform_fee >= 0),
  created_at               timestamptz   NOT NULL DEFAULT now(),
  updated_at               timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_job_id     ON payments(job_id);
CREATE INDEX idx_payments_brand_id   ON payments(brand_id);
CREATE INDEX idx_payments_creator_id ON payments(creator_id);
CREATE INDEX idx_payments_status     ON payments(status);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Each party can read their own payment records
CREATE POLICY "brands_view_own_payments" ON payments
  FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "creators_view_own_payments" ON payments
  FOR SELECT
  USING (auth.uid() = creator_id);

-- ============================================================================
-- Migration 4: Create submissions table
-- ============================================================================

CREATE TABLE submissions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         uuid        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  application_id uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  creator_id     uuid        NOT NULL REFERENCES profiles(id),
  content_url    text        NOT NULL,
  notes          text,
  status         text        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  reviewer_notes text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_job_id         ON submissions(job_id);
CREATE INDEX idx_submissions_application_id ON submissions(application_id);
CREATE INDEX idx_submissions_creator_id     ON submissions(creator_id);
CREATE INDEX idx_submissions_status         ON submissions(status);

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Creators manage (insert/read) their own submissions
CREATE POLICY "creators_manage_own_submissions" ON submissions
  FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Brands can read submissions on their jobs
CREATE POLICY "brands_view_submissions_for_their_jobs" ON submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = submissions.job_id
        AND jobs.brand_id = auth.uid()
    )
  );

-- Brands can approve/reject/request revision
CREATE POLICY "brands_update_submission_status" ON submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = submissions.job_id
        AND jobs.brand_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = submissions.job_id
        AND jobs.brand_id = auth.uid()
    )
  );

-- ============================================================================
-- Migration 5: Create disputes table
-- ============================================================================

CREATE TABLE disputes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid        NOT NULL REFERENCES jobs(id),
  payment_id  uuid        REFERENCES payments(id),
  raised_by   uuid        NOT NULL REFERENCES profiles(id),
  reason      text        NOT NULL,
  status      text        NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  resolution  text,
  resolved_by uuid        REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_disputes_job_id    ON disputes(job_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX idx_disputes_status    ON disputes(status);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Either party on a job can see the dispute
CREATE POLICY "parties_view_own_disputes" ON disputes
  FOR SELECT
  USING (
    auth.uid() = raised_by
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = disputes.job_id
        AND jobs.brand_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = disputes.payment_id
        AND payments.creator_id = auth.uid()
    )
  );

-- Any authenticated user can open a dispute (server validates they are a party)
CREATE POLICY "users_create_disputes" ON disputes
  FOR INSERT
  WITH CHECK (auth.uid() = raised_by);

-- ============================================================================
-- Migration 6: Create messages table
-- ============================================================================

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_manage_their_messages" ON messages
  FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "participants_select_messages" ON messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "participants_insert_messages" ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "participants_update_messages" ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ============================================================================
-- Migration 7: Profiles row-level security policies
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users_insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id)
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_select_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CATCH-UP BLOCK (added 2026-07-12)
-- Everything below was previously only in individual files under
-- supabase/migrations/ and was never added here. If you only ever ran this
-- combined file, your database is very likely missing the "conversations"
-- table entirely, which would make messaging fail completely. Every
-- statement below is written to be safe to re-run even if some of it was
-- already applied by hand.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Migration 8: Create conversations table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (participant_a < participant_b),
  UNIQUE (participant_a, participant_b)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_a ON conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_b ON conversations(participant_b);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Migration 9: Enforce message <-> conversation participant matching
-- ----------------------------------------------------------------------------

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_manage_their_messages" ON messages;
DROP POLICY IF EXISTS "participants_insert_messages" ON messages;
DROP POLICY IF EXISTS "participants_update_messages" ON messages;

CREATE POLICY "participants_insert_messages" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM conversations
      WHERE id = conversation_id
        AND ((participant_a = sender_id AND participant_b = recipient_id)
          OR (participant_a = recipient_id AND participant_b = sender_id))
    )
  );

CREATE POLICY "participants_update_messages" ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ----------------------------------------------------------------------------
-- Migration 10: Canonicalize conversation participant order + policies
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ensure_conversation_participants_order()
RETURNS trigger AS $$
DECLARE
  tmp uuid;
BEGIN
  IF NEW.participant_a IS NULL OR NEW.participant_b IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.participant_a = NEW.participant_b THEN
    RAISE EXCEPTION 'conversation participants must be distinct';
  END IF;

  IF NEW.participant_a > NEW.participant_b THEN
    tmp := NEW.participant_a;
    NEW.participant_a := NEW.participant_b;
    NEW.participant_b := tmp;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_participants_order ON conversations;
CREATE TRIGGER conversations_participants_order
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_conversation_participants_order();

DROP POLICY IF EXISTS "participants_select_conversations" ON conversations;
DROP POLICY IF EXISTS "participants_insert_conversations" ON conversations;
DROP POLICY IF EXISTS "participants_update_conversations" ON conversations;

CREATE POLICY "participants_select_conversations" ON conversations
  FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "participants_insert_conversations" ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "participants_update_conversations" ON conversations
  FOR UPDATE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b)
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

-- ----------------------------------------------------------------------------
-- Migration 11: Legacy profile metadata columns (niche/location/price/platforms)
-- ----------------------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS niche text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS price text,
  ADD COLUMN IF NOT EXISTS platforms text[];

-- ----------------------------------------------------------------------------
-- Migration 12: Public creator profile visibility
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "public_select_creator_profiles" ON profiles;
CREATE POLICY "public_select_creator_profiles" ON profiles
  FOR SELECT
  USING (role = 'creator');

-- ----------------------------------------------------------------------------
-- Migration 13: Conversation participants can see each other's profile
-- (Fixes: creators viewing a conversation with a brand got a hard error,
-- because brands had no SELECT policy on profiles at all.)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "conversation_participants_select_profiles" ON profiles;
CREATE POLICY "conversation_participants_select_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE (participant_a = auth.uid() AND participant_b = profiles.id)
         OR (participant_b = auth.uid() AND participant_a = profiles.id)
    )
  );

-- ----------------------------------------------------------------------------
-- Additional profile fields (creator packages/content/availability)
-- ----------------------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS platform_stats jsonb,
  ADD COLUMN IF NOT EXISTS packages       jsonb,
  ADD COLUMN IF NOT EXISTS content_urls   jsonb,
  ADD COLUMN IF NOT EXISTS content_types  text[],
  ADD COLUMN IF NOT EXISTS available      boolean NOT NULL DEFAULT true;

-- ----------------------------------------------------------------------------
-- Reviews table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id     uuid        NOT NULL REFERENCES jobs(id)     ON DELETE CASCADE,
  rating     integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, job_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Brands can insert their own reviews" ON reviews;
CREATE POLICY "Brands can insert their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = brand_id);

-- ----------------------------------------------------------------------------
-- Avatar storage bucket
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------------------------------------------
-- Default currency to GBP (CreatorHub is UK-only; jobs/payments defaulted to
-- 'usd' even though every price shown in the app is in GBP)
-- ----------------------------------------------------------------------------

ALTER TABLE jobs ALTER COLUMN currency SET DEFAULT 'gbp';
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'gbp';

UPDATE jobs SET currency = 'gbp' WHERE currency = 'usd';
UPDATE payments SET currency = 'gbp' WHERE currency = 'usd';

-- ----------------------------------------------------------------------------
-- Creator waitlist (pre-launch lead capture, shared as a standalone link).
-- No RLS policies on purpose — only the server-side service role can read or
-- write this table.
-- ----------------------------------------------------------------------------

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
