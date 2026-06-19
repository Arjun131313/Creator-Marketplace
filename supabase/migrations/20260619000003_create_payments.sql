CREATE TABLE payments (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                   uuid          NOT NULL REFERENCES jobs(id),
  application_id           uuid          REFERENCES applications(id),
  brand_id                 uuid          NOT NULL REFERENCES profiles(id),
  creator_id               uuid          NOT NULL REFERENCES profiles(id),
  stripe_payment_intent_id text          UNIQUE,
  amount                   numeric(10,2) NOT NULL CHECK (amount > 0),
  currency                 text          NOT NULL DEFAULT 'usd',
  status                   text          NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  platform_fee             numeric(10,2) CHECK (platform_fee >= 0),
  created_at               timestamptz   NOT NULL DEFAULT now(),
  updated_at               timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_job_id     ON payments(job_id);
CREATE INDEX idx_payments_brand_id   ON payments(brand_id);
CREATE INDEX idx_payments_creator_id ON payments(creator_id);
CREATE INDEX idx_payments_status     ON payments(status);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Each party can read their own payment records
CREATE POLICY "brands_view_own_payments" ON payments
  FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "creators_view_own_payments" ON payments
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Inserts and status updates are handled server-side via service role (Stripe webhooks)
