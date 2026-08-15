-- Brand events: brands host in-person events (launches, shoots, press days)
-- and creators apply to attend. Separate from `jobs` because the unit of work
-- is attendance at a fixed time and place, not a delivered piece of content —
-- there's no escrow, no submission, and no payout attached.

CREATE TABLE events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text        NOT NULL,
  venue       text,
  city        text        NOT NULL,
  starts_at   timestamptz NOT NULL,
  capacity    integer     CHECK (capacity IS NULL OR capacity > 0),
  perks       text,
  status      text        NOT NULL DEFAULT 'published'
                CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_brand_id  ON events(brand_id);
CREATE INDEX idx_events_status    ON events(status);
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_events_city      ON events(city);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_views_published_events" ON events
  FOR SELECT
  USING (status = 'published' OR auth.uid() = brand_id);

CREATE POLICY "brands_manage_own_events" ON events
  FOR ALL
  USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

CREATE TABLE event_applications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  creator_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  message    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, creator_id)
);

CREATE INDEX idx_event_applications_event_id   ON event_applications(event_id);
CREATE INDEX idx_event_applications_creator_id ON event_applications(creator_id);

CREATE TRIGGER event_applications_updated_at
  BEFORE UPDATE ON event_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE event_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creators_manage_own_event_applications" ON event_applications
  FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "brands_view_applications_for_their_events" ON event_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_applications.event_id
        AND events.brand_id = auth.uid()
    )
  );

CREATE POLICY "brands_update_event_application_status" ON event_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_applications.event_id
        AND events.brand_id = auth.uid()
    )
  );

-- Public attendee counts for published events, mirroring
-- job_application_counts: aggregate only, never row-level applicant data,
-- so the browse page can show "N applied" without exposing who applied.
CREATE OR REPLACE FUNCTION public.event_application_counts(event_ids uuid[])
RETURNS TABLE (event_id uuid, application_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT ea.event_id, count(*) AS application_count
  FROM event_applications ea
  JOIN events e ON e.id = ea.event_id
  WHERE ea.event_id = ANY (event_ids)
    AND e.status = 'published'
  GROUP BY ea.event_id;
$$;

GRANT EXECUTE ON FUNCTION public.event_application_counts(uuid[]) TO anon, authenticated;
