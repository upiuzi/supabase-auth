-- Backfill invoice_no for all existing orders where invoice_no is NULL
-- Uses the same logic: ddMMyyyyXXXXX (date from created_at, random int)

UPDATE orders
SET invoice_no =
    to_char(created_at, 'DDMMYYYY') ||
    (FLOOR(RANDOM() * 90000) + 1000)::int
WHERE invoice_no IS NULL;
