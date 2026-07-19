-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Adds niche, platform_stats, and packages columns to the profiles table

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS niche text,
  ADD COLUMN IF NOT EXISTS platform_stats jsonb,
  ADD COLUMN IF NOT EXISTS packages jsonb;

-- RLS: creators can update their own profile fields
-- If you haven't already enabled an update policy, add one:
-- CREATE POLICY "Creators can update own profile"
--   ON profiles FOR UPDATE
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);
