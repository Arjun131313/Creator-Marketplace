-- Run in Supabase Dashboard → SQL Editor

-- New columns on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS content_urls  jsonb,
  ADD COLUMN IF NOT EXISTS content_types text[],
  ADD COLUMN IF NOT EXISTS available     boolean NOT NULL DEFAULT true;

-- Note: platform_stats JSONB structure is changing from
--   { instagram: number, tiktok: number, youtube: number }
-- to
--   { instagram: { followers: number, username: string },
--     tiktok:    { followers: number, username: string },
--     snapchat:  { followers: number, username: string } }
-- No schema migration needed (JSONB is schemaless).
-- Existing creators will need to re-save their profile stats.

-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Storage: create an "avatars" bucket (run once manually or via API)
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Go to Supabase Dashboard → Storage → New bucket
-- 2. Name: avatars
-- 3. Public bucket: YES (toggle on)
--
-- Then add these RLS policies on the bucket objects:
-- Policy name: "Authenticated users can upload their own avatar"
--   OPERATION: INSERT
--   USING: auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy name: "Anyone can read avatars"
--   OPERATION: SELECT
--   USING: true
--
-- Or run the SQL below (storage schema):

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
