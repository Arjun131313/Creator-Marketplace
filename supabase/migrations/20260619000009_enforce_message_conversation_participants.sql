-- Enforce that inserted messages belong to an existing conversation between sender and recipient.
-- This prevents a logged-in user from inserting a message into a conversation they are not part of.

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_manage_their_messages" ON messages;
DROP POLICY IF EXISTS "participants_insert_messages" ON messages;

CREATE POLICY "participants_insert_messages" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM conversations
      WHERE id = conversation_id
        AND ((participant_a = sender_id AND participant_b = recipient_id)
          OR (participant_a = recipient_id AND participant_b = sender_id))
    )
  );

CREATE POLICY "participants_update_messages" ON messages
  FOR UPDATE
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  )
  WITH CHECK (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );
