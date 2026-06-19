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
