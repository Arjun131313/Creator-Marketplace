-- Structured brief fields (content type, platform, duration, language, talking
-- points) so brands fill in distinct fields instead of one free-text
-- description — mirrors how competitor briefs are structured, and makes jobs
-- easier to filter/browse. All nullable: existing rows and jobs that skip
-- them stay valid, the UI enforces what's required on new submissions.
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS video_duration text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS talking_points text,
  ADD COLUMN IF NOT EXISTS requires_shipping boolean NOT NULL DEFAULT false;

-- Shipping address a creator provides once accepted onto a physical-product
-- job. Plain text rather than structured address fields — kept simple since
-- it's just relayed to the brand to print a label, not validated/geocoded.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS shipping_address text;
