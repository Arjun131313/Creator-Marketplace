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
-- Migration 6: Profiles row-level security policies
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
