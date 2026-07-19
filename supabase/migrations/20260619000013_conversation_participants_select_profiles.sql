-- Creators can already be viewed publicly (role = 'creator'), but brands have no
-- visibility policy at all. This breaks the conversation page for creators: it looks up
-- the other participant's profile with .single(), which errors when RLS hides the row.
-- Fix: let conversation participants see each other's profile regardless of role.

DROP POLICY IF EXISTS "conversation_participants_select_profiles" ON profiles;
CREATE POLICY "conversation_participants_select_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE (participant_a = auth.uid() AND participant_b = profiles.id)
         OR (participant_b = auth.uid() AND participant_a = profiles.id)
    )
  );
