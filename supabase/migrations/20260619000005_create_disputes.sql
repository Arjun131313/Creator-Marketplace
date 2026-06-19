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
