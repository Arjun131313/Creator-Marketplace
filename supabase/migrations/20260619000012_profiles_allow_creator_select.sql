CREATE POLICY IF NOT EXISTS "public_select_creator_profiles" ON profiles
  FOR SELECT
  USING (role = 'creator');
