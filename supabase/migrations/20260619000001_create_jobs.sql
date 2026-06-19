-- Shared trigger function for updated_at (referenced by all tables below)
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
