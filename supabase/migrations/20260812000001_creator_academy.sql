-- Creator Academy: creators publish paid lessons that other creators buy.
-- Public-safe metadata (title/description/price) lives in academy_lessons,
-- which anyone can browse. The actual content link is split into a separate
-- table so RLS can gate it properly — only the teacher or a paid buyer can
-- read it — rather than relying on the client to just not fetch that column.

CREATE TABLE academy_lessons (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text          NOT NULL,
  description text          NOT NULL,
  price       numeric(10,2) NOT NULL CHECK (price > 0),
  currency    text          NOT NULL DEFAULT 'gbp',
  category    text,
  status      text          NOT NULL DEFAULT 'published'
                CHECK (status IN ('draft', 'published', 'archived')),
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_lessons_creator_id ON academy_lessons(creator_id);
CREATE INDEX idx_academy_lessons_status     ON academy_lessons(status);

CREATE TRIGGER academy_lessons_updated_at
  BEFORE UPDATE ON academy_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_views_published_lessons" ON academy_lessons
  FOR SELECT
  USING (status = 'published' OR auth.uid() = creator_id);

CREATE POLICY "creators_manage_own_lessons" ON academy_lessons
  FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Purchases table created before lesson_content so lesson_content's RLS
-- policy can reference it.
CREATE TABLE academy_purchases (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id                uuid          NOT NULL REFERENCES academy_lessons(id),
  buyer_id                 uuid          NOT NULL REFERENCES profiles(id),
  teacher_id               uuid          NOT NULL REFERENCES profiles(id),
  stripe_payment_intent_id text          UNIQUE,
  amount                   numeric(10,2) NOT NULL CHECK (amount > 0),
  currency                 text          NOT NULL DEFAULT 'gbp',
  platform_fee             numeric(10,2) CHECK (platform_fee >= 0),
  status                   text          NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'paid', 'refunded')),
  created_at               timestamptz   NOT NULL DEFAULT now(),
  updated_at               timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_purchases_lesson_id  ON academy_purchases(lesson_id);
CREATE INDEX idx_academy_purchases_buyer_id   ON academy_purchases(buyer_id);
CREATE INDEX idx_academy_purchases_teacher_id ON academy_purchases(teacher_id);

CREATE TRIGGER academy_purchases_updated_at
  BEFORE UPDATE ON academy_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE academy_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parties_view_own_purchases" ON academy_purchases
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = teacher_id);

-- Inserts and status updates are handled server-side via service role
-- (Stripe checkout + webhooks), matching the `payments` table convention.

-- Gated content — a row here is only readable by the lesson's own creator or
-- someone with a paid purchase record for that lesson.
CREATE TABLE academy_lesson_content (
  lesson_id   uuid PRIMARY KEY REFERENCES academy_lessons(id) ON DELETE CASCADE,
  content_url text NOT NULL
);

ALTER TABLE academy_lesson_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_manages_own_lesson_content" ON academy_lesson_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM academy_lessons
      WHERE academy_lessons.id = academy_lesson_content.lesson_id
        AND academy_lessons.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_lessons
      WHERE academy_lessons.id = academy_lesson_content.lesson_id
        AND academy_lessons.creator_id = auth.uid()
    )
  );

CREATE POLICY "buyers_view_purchased_lesson_content" ON academy_lesson_content
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academy_purchases
      WHERE academy_purchases.lesson_id = academy_lesson_content.lesson_id
        AND academy_purchases.buyer_id = auth.uid()
        AND academy_purchases.status = 'paid'
    )
  );
