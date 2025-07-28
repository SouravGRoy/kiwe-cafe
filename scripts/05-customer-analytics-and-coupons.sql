-- ================================================================
-- Feature 1: Customer Analytics Schema
-- ================================================================

-- Create customers table to track unique customers and their metadata
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer analytics view for admin dashboard
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
  c.id,
  c.phone,
  c.first_name,
  c.last_name,
  c.total_orders,
  c.total_spent,
  c.loyalty_points,
  c.first_order_date,
  c.last_order_date,
  CASE 
    WHEN c.total_orders = 1 THEN 'New Customer'
    WHEN c.total_orders BETWEEN 2 AND 4 THEN 'Regular Customer'
    WHEN c.total_orders >= 5 THEN 'VIP Customer'
    ELSE 'Unknown'
  END as customer_tier,
  DATE_PART('day', NOW() - c.last_order_date) as days_since_last_order
FROM customers c
ORDER BY c.last_order_date DESC;

-- ================================================================
-- Feature 2: Coupon System Schema
-- ================================================================

-- Create coupon_types table for managing different coupon categories
CREATE TABLE IF NOT EXISTS coupon_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default coupon types
INSERT INTO coupon_types (name, description) VALUES 
('WELCOME', 'Welcome coupon for first-time customers'),
('LOYALTY', 'Loyalty reward coupon for repeat customers'),
('CAMPAIGN', 'Manual campaign coupons sent by admin')
ON CONFLICT DO NOTHING;

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  type_id UUID REFERENCES coupon_types(id),
  customer_phone VARCHAR(15) NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  maximum_discount_amount DECIMAL(10,2),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  used_in_order_id UUID REFERENCES orders(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  generated_by VARCHAR(50) DEFAULT 'system', -- 'system' or 'admin'
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupon usage history for analytics
CREATE TABLE IF NOT EXISTS coupon_usage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id),
  order_id UUID REFERENCES orders(id),
  customer_phone VARCHAR(15) NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  original_total DECIMAL(10,2) NOT NULL,
  final_total DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Updated Orders Table Schema
-- ================================================================

-- Add coupon-related fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_total DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(20);

-- Update the existing orders to have original_total same as total where not set
UPDATE orders SET original_total = total WHERE original_total IS NULL;

-- ================================================================
-- Indexes for Performance
-- ================================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_total_orders ON customers(total_orders);
CREATE INDEX IF NOT EXISTS idx_customers_last_order_date ON customers(last_order_date);

-- Coupon indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_customer_phone ON coupons(customer_phone);
CREATE INDEX IF NOT EXISTS idx_coupons_is_used ON coupons(is_used);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_type_id ON coupons(type_id);

-- Orders indexes for coupons
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- ================================================================
-- Functions and Triggers
-- ================================================================

-- Function to update customer statistics when an order is placed
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update customer record
  INSERT INTO customers (phone, first_order_date, last_order_date, total_orders, total_spent)
  VALUES (NEW.customer_phone, NEW.created_at, NEW.created_at, 1, NEW.total)
  ON CONFLICT (phone) 
  DO UPDATE SET 
    last_order_date = NEW.created_at,
    total_orders = customers.total_orders + 1,
    total_spent = customers.total_spent + NEW.total,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer stats on new orders
CREATE TRIGGER update_customer_stats_trigger 
  AFTER INSERT ON orders 
  FOR EACH ROW 
  WHEN (NEW.customer_phone IS NOT NULL)
  EXECUTE FUNCTION update_customer_stats();

-- Function to generate coupon codes
CREATE OR REPLACE FUNCTION generate_coupon_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substr(md5(random()::text), 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM coupons WHERE coupons.code = code) INTO exists;
    
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate welcome coupon for new customers
CREATE OR REPLACE FUNCTION generate_welcome_coupon()
RETURNS TRIGGER AS $$
DECLARE
  coupon_code TEXT;
  coupon_type_id UUID;
BEGIN
  -- Only generate welcome coupon for first-time customers
  IF NEW.total_orders = 1 THEN
    -- Get welcome coupon type ID
    SELECT id INTO coupon_type_id FROM coupon_types WHERE name = 'WELCOME' LIMIT 1;
    
    -- Generate unique coupon code
    coupon_code := generate_coupon_code();
    
    -- Insert welcome coupon (10% off, expires in 30 days)
    INSERT INTO coupons (
      code, 
      type_id, 
      customer_phone, 
      discount_type, 
      discount_value,
      minimum_order_amount,
      maximum_discount_amount,
      expires_at,
      generated_by
    ) VALUES (
      coupon_code,
      coupon_type_id,
      NEW.phone,
      'percentage',
      10.00,
      100.00, -- Minimum order ₹100
      200.00, -- Maximum discount ₹200
      NOW() + INTERVAL '30 days',
      'system'
    );
  END IF;
  
  -- Generate loyalty coupon after 5 orders
  IF NEW.total_orders = 5 THEN
    SELECT id INTO coupon_type_id FROM coupon_types WHERE name = 'LOYALTY' LIMIT 1;
    coupon_code := generate_coupon_code();
    
    INSERT INTO coupons (
      code, 
      type_id, 
      customer_phone, 
      discount_type, 
      discount_value,
      minimum_order_amount,
      expires_at,
      generated_by
    ) VALUES (
      coupon_code,
      coupon_type_id,
      NEW.phone,
      'fixed',
      50.00, -- ₹50 off
      200.00, -- Minimum order ₹200
      NOW() + INTERVAL '60 days',
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate coupons
CREATE TRIGGER generate_welcome_coupon_trigger 
  AFTER UPDATE ON customers 
  FOR EACH ROW 
  EXECUTE FUNCTION generate_welcome_coupon();

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_coupon_code TEXT,
  p_customer_phone TEXT,
  p_order_total DECIMAL
)
RETURNS TABLE(
  is_valid BOOLEAN,
  discount_amount DECIMAL,
  error_message TEXT,
  coupon_id UUID
) AS $$
DECLARE
  coupon_rec RECORD;
  calculated_discount DECIMAL := 0;
BEGIN
  -- Find the coupon
  SELECT * INTO coupon_rec 
  FROM coupons c
  JOIN coupon_types ct ON c.type_id = ct.id
  WHERE c.code = p_coupon_code 
    AND c.customer_phone = p_customer_phone;
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Invalid coupon code or not assigned to this customer', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if already used
  IF coupon_rec.is_used THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Coupon has already been used', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if expired
  IF coupon_rec.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Coupon has expired', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check minimum order amount
  IF p_order_total < coupon_rec.minimum_order_amount THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 
      format('Minimum order amount is ₹%s', coupon_rec.minimum_order_amount), 
      NULL::UUID;
    RETURN;
  END IF;
  
  -- Calculate discount
  IF coupon_rec.discount_type = 'percentage' THEN
    calculated_discount := (p_order_total * coupon_rec.discount_value / 100);
    -- Apply maximum discount limit if set
    IF coupon_rec.maximum_discount_amount IS NOT NULL THEN
      calculated_discount := LEAST(calculated_discount, coupon_rec.maximum_discount_amount);
    END IF;
  ELSE
    calculated_discount := coupon_rec.discount_value;
  END IF;
  
  -- Ensure discount doesn't exceed order total
  calculated_discount := LEAST(calculated_discount, p_order_total);
  
  RETURN QUERY SELECT true, calculated_discount, ''::TEXT, coupon_rec.id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for new tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage_history ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow all operations
CREATE POLICY "Allow all customer operations" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all coupon_types operations" ON coupon_types FOR ALL USING (true);
CREATE POLICY "Allow all coupon operations" ON coupons FOR ALL USING (true);
CREATE POLICY "Allow all coupon_usage operations" ON coupon_usage_history FOR ALL USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
