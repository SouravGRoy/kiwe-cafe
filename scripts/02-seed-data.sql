-- Insert sample menu items
INSERT INTO menu_items (name, price, description, available) VALUES
('Classic Breakfast', 250.00, 'A combination of 2 scrambled eggs, chicken sausages, grilled tomatoes, toast and butter.', true),
('Margherita Pizza', 320.00, 'Fresh mozzarella, tomato sauce, and basil on a crispy thin crust.', true),
('Chicken Caesar Salad', 280.00, 'Grilled chicken breast with romaine lettuce, parmesan cheese, and caesar dressing.', true),
('Beef Burger', 380.00, 'Juicy beef patty with lettuce, tomato, onion, and special sauce.', false),
('Pasta Carbonara', 340.00, 'Creamy pasta with bacon, eggs, and parmesan cheese.', true),
('Fish & Chips', 420.00, 'Beer-battered fish with crispy fries and tartar sauce.', true),
('Cappuccino', 120.00, 'Rich espresso with steamed milk and foam.', true),
('Chocolate Cake', 180.00, 'Decadent chocolate cake with chocolate ganache.', true);

-- Insert sample add-ons
INSERT INTO add_ons (menu_item_id, name, price) VALUES
((SELECT id FROM menu_items WHERE name = 'Classic Breakfast'), 'Extra Egg', 50.00),
((SELECT id FROM menu_items WHERE name = 'Classic Breakfast'), 'Extra Bacon', 80.00),
((SELECT id FROM menu_items WHERE name = 'Margherita Pizza'), 'Extra Cheese', 60.00),
((SELECT id FROM menu_items WHERE name = 'Margherita Pizza'), 'Pepperoni', 100.00),
((SELECT id FROM menu_items WHERE name = 'Beef Burger'), 'Extra Cheese', 40.00),
((SELECT id FROM menu_items WHERE name = 'Beef Burger'), 'Add Fries', 80.00),
((SELECT id FROM menu_items WHERE name = 'Pasta Carbonara'), 'Extra Bacon', 70.00),
((SELECT id FROM menu_items WHERE name = 'Fish & Chips'), 'Extra Fries', 60.00),
((SELECT id FROM menu_items WHERE name = 'Cappuccino'), 'Extra Shot', 30.00),
((SELECT id FROM menu_items WHERE name = 'Cappuccino'), 'Oat Milk', 25.00);

-- Create an admin user (you'll need to sign up with this email first)
-- Then run this to make them admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@cafe.com';

-- Insert admin user (replace with your actual admin email)
-- Note: You still need to sign up with this email first through the UI
-- Then this will set their role to admin
UPDATE profiles SET role = 'admin' WHERE email = 'admin@cafe.com';
