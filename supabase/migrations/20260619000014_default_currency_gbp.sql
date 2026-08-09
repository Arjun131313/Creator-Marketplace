-- CreatorHub operates in the UK; jobs/payments defaulted to 'usd' even though every
-- price shown in the app is in GBP. Switches the default going forward and backfills
-- any existing rows that were inserted before this fix.

ALTER TABLE jobs ALTER COLUMN currency SET DEFAULT 'gbp';
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'gbp';

UPDATE jobs SET currency = 'gbp' WHERE currency = 'usd';
UPDATE payments SET currency = 'gbp' WHERE currency = 'usd';
