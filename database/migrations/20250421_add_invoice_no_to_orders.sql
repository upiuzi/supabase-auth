-- Add invoice_no column to orders, make it required and unique
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(32);

-- Make all existing invoice_no unique (if possible, otherwise fill with generated values)
-- You may need to backfill here manually if you have existing data

-- Set NOT NULL and UNIQUE constraint
ALTER TABLE orders
ALTER COLUMN invoice_no SET NOT NULL;
ALTER TABLE orders
ADD CONSTRAINT orders_invoice_no_unique UNIQUE (invoice_no);
