-- Ensure conversation participants are canonicalized (participant_a < participant_b)
-- and enforce RLS policies that only allow participants to insert/select/update.

CREATE OR REPLACE FUNCTION public.ensure_conversation_participants_order()
RETURNS trigger AS $$
DECLARE
  tmp uuid;
BEGIN
  IF NEW.participant_a IS NULL OR NEW.participant_b IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.participant_a = NEW.participant_b THEN
    RAISE EXCEPTION 'conversation participants must be distinct';
  END IF;

  IF NEW.participant_a > NEW.participant_b THEN
    tmp := NEW.participant_a;
    NEW.participant_a := NEW.participant_b;
    NEW.participant_b := tmp;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_participants_order ON conversations;
CREATE TRIGGER conversations_participants_order
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_conversation_participants_order();

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_select_conversations" ON conversations;
DROP POLICY IF EXISTS "participants_insert_conversations" ON conversations;
DROP POLICY IF EXISTS "participants_update_conversations" ON conversations;

CREATE POLICY "participants_select_conversations" ON conversations
  FOR SELECT
  USING (
    auth.uid() = participant_a OR auth.uid() = participant_b
  );

CREATE POLICY "participants_insert_conversations" ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant_a OR auth.uid() = participant_b
  );

CREATE POLICY "participants_update_conversations" ON conversations
  FOR UPDATE
  USING (
    auth.uid() = participant_a OR auth.uid() = participant_b
  )
  WITH CHECK (
    auth.uid() = participant_a OR auth.uid() = participant_b
  );
