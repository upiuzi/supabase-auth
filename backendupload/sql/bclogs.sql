-- Table: public.bclogs
CREATE TABLE IF NOT EXISTS public.bclogs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL,
    message text NOT NULL,
    session text NOT NULL,
    log_date timestamp with time zone DEFAULT now()
);
-- Optional: Index for faster lookup by customer
CREATE INDEX IF NOT EXISTS idx_bclogs_customer_id ON public.bclogs (customer_id);
CREATE INDEX IF NOT EXISTS idx_bclogs_log_date ON public.bclogs (log_date DESC);
