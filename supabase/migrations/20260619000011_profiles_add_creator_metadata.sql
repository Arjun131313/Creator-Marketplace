ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS niche text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS price text,
  ADD COLUMN IF NOT EXISTS platforms text[];
