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
