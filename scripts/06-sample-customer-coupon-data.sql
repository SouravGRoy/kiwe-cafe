-- Sample test data for Customer Analytics and Coupon System

-- Insert sample customer data (this will be automatically populated as orders are placed)
INSERT INTO customers (phone, first_name, last_name, total_orders, total_spent, first_order_date, last_order_date) VALUES 
('9876543210', 'John', 'Doe', 8, 2450.00, '2024-12-01', '2025-01-25'),
('9876543211', 'Jane', 'Smith', 3, 890.00, '2024-12-15', '2025-01-20'),
('9876543212', 'Mike', 'Johnson', 1, 350.00, '2025-01-22', '2025-01-22'),
('9876543213', 'Sarah', 'Williams', 12, 4200.00, '2024-11-10', '2025-01-26'),
('9876543214', 'David', 'Brown', 2, 650.00, '2024-12-20', '2025-01-18'),
('9876543215', 'Lisa', 'Davis', 6, 1800.00, '2024-12-05', '2025-01-24'),
('9876543216', 'Tom', 'Wilson', 1, 420.00, '2025-01-26', '2025-01-26'),
('9876543217', 'Emma', 'Miller', 4, 1200.00, '2024-12-10', '2025-01-19'),
('9876543218', 'James', 'Garcia', 7, 2100.00, '2024-11-25', '2025-01-23'),
('9876543219', 'Anna', 'Martinez', 1, 380.00, '2025-01-25', '2025-01-25')
ON CONFLICT (phone) DO NOTHING;

-- Sample coupon data - These would normally be auto-generated, but adding for testing
INSERT INTO coupons (code, type_id, customer_phone, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, is_used, expires_at, generated_by) VALUES 
(
  'WELCOME10', 
  (SELECT id FROM coupon_types WHERE name = 'WELCOME' LIMIT 1),
  '9876543212', 
  'percentage', 
  10.00, 
  100.00, 
  200.00, 
  false, 
  '2025-02-25', 
  'system'
),
(
  'LOYALTY50', 
  (SELECT id FROM coupon_types WHERE name = 'LOYALTY' LIMIT 1),
  '9876543210', 
  'fixed', 
  50.00, 
  200.00, 
  NULL, 
  true, 
  '2025-03-25', 
  'system'
),
(
  'SPECIAL100', 
  (SELECT id FROM coupon_types WHERE name = 'CAMPAIGN' LIMIT 1),
  '9876543211', 
  'fixed', 
  100.00, 
  500.00, 
  NULL, 
  false, 
  '2025-02-15', 
  'admin'
),
(
  'WELCOME15', 
  (SELECT id FROM coupon_types WHERE name = 'WELCOME' LIMIT 1),
  '9876543216', 
  'percentage', 
  10.00, 
  100.00, 
  200.00, 
  false, 
  '2025-02-26', 
  'system'
),
(
  'NEWYEAR20', 
  (SELECT id FROM coupon_types WHERE name = 'CAMPAIGN' LIMIT 1),
  '9876543213', 
  'percentage', 
  20.00, 
  300.00, 
  500.00, 
  false, 
  '2025-02-01', 
  'admin'
),
(
  'LOYALTY75', 
  (SELECT id FROM coupon_types WHERE name = 'LOYALTY' LIMIT 1),
  '9876543218', 
  'fixed', 
  75.00, 
  250.00, 
  NULL, 
  false, 
  '2025-03-20', 
  'system'
)
ON CONFLICT (code) DO NOTHING;

-- Sample coupon usage history for the used coupon
-- First, let's create sample orders that we can reference
INSERT INTO orders (id, total, original_total, customer_name, customer_phone, table_number, status, coupon_code, discount_amount, session_id, created_at) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001', -- Fixed UUID for reference
  530.00, -- final total after discount
  580.00, -- original total before discount
  'John Doe',
  '9876543210',
  3,
  'completed',
  'LOYALTY50',
  50.00,
  '9876543210_table_3',
  '2025-01-20 14:30:00'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  350.00,
  350.00,
  'Mike Johnson',
  '9876543212',
  5,
  'completed',
  NULL,
  0.00,
  '9876543212_table_5',
  '2025-01-22 12:15:00'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  420.00,
  420.00,
  'Tom Wilson',
  '9876543216',
  2,
  'completed',
  NULL,
  0.00,
  '9876543216_table_2',
  '2025-01-26 18:45:00'
) ON CONFLICT (id) DO NOTHING;

-- Add some sample order items for these orders
INSERT INTO order_items (order_id, menu_item_id, quantity, item_price, menu_item_name, notes) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM menu_items LIMIT 1),
  2,
  150.00,
  'Sample Item 1',
  'Extra spicy'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM menu_items OFFSET 1 LIMIT 1),
  1,
  280.00,
  'Sample Item 2',
  NULL
) ON CONFLICT DO NOTHING;

-- Now insert the coupon usage history with the actual order ID
INSERT INTO coupon_usage_history (coupon_id, order_id, customer_phone, discount_applied, original_total, final_total, used_at) VALUES
(
  (SELECT id FROM coupons WHERE code = 'LOYALTY50' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001', -- Reference the order we just created
  '9876543210',
  50.00,
  580.00,
  530.00,
  '2025-01-20 14:30:00'
) ON CONFLICT DO NOTHING;

-- Update the used coupon
UPDATE coupons 
SET is_used = true, 
    used_at = '2025-01-20 14:30:00',
    used_in_order_id = '550e8400-e29b-41d4-a716-446655440001' -- Reference the order we created
WHERE code = 'LOYALTY50';

-- Test coupon validation scenarios
-- You can test these coupon codes:
-- WELCOME10 - 10% off for new customer (9876543212), minimum ₹100, max discount ₹200
-- SPECIAL100 - ₹100 off for customer (9876543211), minimum ₹500
-- NEWYEAR20 - 20% off for VIP customer (9876543213), minimum ₹300, max discount ₹500
-- LOYALTY75 - ₹75 off for customer (9876543218), minimum ₹250
-- WELCOME15 - 10% off for new customer (9876543216), minimum ₹100, max discount ₹200

-- Sample WhatsApp notification messages (for reference)
/*
Welcome Coupon:
"🎉 Welcome to Kiwe Cafe! Here's a special 10% off coupon for your first order: WELCOME10. Valid till 25 Feb 2025. Minimum order ₹100. Happy dining!"

Loyalty Coupon:
"🌟 Thank you for being a loyal customer! You've unlocked a ₹50 off coupon: LOYALTY50. Valid till 25 Mar 2025. Minimum order ₹200. Enjoy your meal!"

Campaign Coupon:
"🎊 Special offer just for you! Get ₹100 off your next order with coupon: SPECIAL100. Valid till 15 Feb 2025. Minimum order ₹500. Don't miss out!"
*/
