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
