-- Add customer_phone column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(15);

-- Update the orders table to ensure all required columns exist
-- (This is safe to run multiple times)
ALTER TABLE orders 
  ALTER COLUMN table_number SET NOT NULL,
  ALTER COLUMN table_number SET DEFAULT 1;

-- Create index for phone queries if needed
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
