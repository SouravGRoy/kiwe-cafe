-- Add session management to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS session_id character varying;

-- Create unique index for phone + table combination to prevent duplicate active sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_active_session 
ON public.orders (customer_phone, table_number) 
WHERE status IN ('pending', 'preparing', 'ready');

-- Add index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);

-- Update existing orders to have session_id (phone + table combination)
UPDATE public.orders 
SET session_id = CONCAT(COALESCE(customer_phone, 'guest'), '_table_', table_number)
WHERE session_id IS NULL;
