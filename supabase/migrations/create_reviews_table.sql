-- Run this in Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS reviews (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id     uuid        NOT NULL REFERENCES jobs(id)     ON DELETE CASCADE,
  rating     integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, job_id)   -- one review per brand per job
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read reviews
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (true);

-- Authenticated brands can insert their own reviews only
CREATE POLICY "Brands can insert their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = brand_id);
