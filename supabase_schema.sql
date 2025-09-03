-- Supabase Schema for Food Ordering System
-- This schema includes users, orders, order_items, and menu_items tables with RLS and realtime subscriptions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. USERS TABLE
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    emailid VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. ORDERS TABLE
-- ========================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
    order_amount DECIMAL(10,2) NOT NULL CHECK (order_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. ORDER_ITEMS TABLE
-- ========================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. MENU_ITEMS TABLE
-- ========================================
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    category VARCHAR(100),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_users_emailid ON users(emailid);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Menu items indexes
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_name ON menu_items(name);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================
-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it already exists to prevent errors on re-run
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Menu items updated_at trigger
CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists to prevent errors on re-run
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_items_updated_at();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- USERS RLS POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- ========================================
-- ORDERS RLS POLICIES
-- ========================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own orders (limited fields)
CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Staff can view all orders
CREATE POLICY "Staff can view all orders" ON orders
    FOR SELECT USING (true);

-- Staff can update all orders
CREATE POLICY "Staff can update all orders" ON orders
    FOR UPDATE USING (true);

-- ========================================
-- ORDER_ITEMS RLS POLICIES
-- ========================================

-- Users can view items from their own orders
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id::text = auth.uid()::text
        )
    );

-- Users can insert items to their own orders
CREATE POLICY "Users can insert own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id::text = auth.uid()::text
        )
    );

-- Staff can view all order items
CREATE POLICY "Staff can view all order items" ON order_items
    FOR SELECT USING (true);

-- Staff can insert order items
CREATE POLICY "Staff can insert order items" ON order_items
    FOR INSERT WITH CHECK (true);

-- Staff can update order items
CREATE POLICY "Staff can update order items" ON order_items
    FOR UPDATE USING (true);

-- Staff can delete order items
CREATE POLICY "Staff can delete order items" ON order_items
    FOR DELETE USING (true);

-- ========================================
-- MENU_ITEMS RLS POLICIES
-- ========================================

-- Anyone can view available menu items
CREATE POLICY "Anyone can view available menu items" ON menu_items
    FOR SELECT USING (is_available = true);

-- Staff can view all menu items
CREATE POLICY "Staff can view all menu items" ON menu_items
    FOR SELECT USING (true);

-- Staff can insert menu items
CREATE POLICY "Staff can insert menu items" ON menu_items
    FOR INSERT WITH CHECK (true);

-- Staff can update menu items
CREATE POLICY "Staff can update menu items" ON menu_items
    FOR UPDATE USING (true);

-- Staff can delete menu items
CREATE POLICY "Staff can delete menu items" ON menu_items
    FOR DELETE USING (true);

-- ========================================
-- REALTIME SUBSCRIPTIONS
-- ========================================

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for order_items table
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get user's orders with items
CREATE OR REPLACE FUNCTION get_user_orders(user_uuid UUID)
RETURNS TABLE (
    order_id UUID,
    order_status VARCHAR(50),
    order_amount DECIMAL(10,2),
    order_created_at TIMESTAMP WITH TIME ZONE,
    order_updated_at TIMESTAMP WITH TIME ZONE,
    items JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as order_id,
        o.status as order_status,
        o.order_amount,
        o.created_at as order_created_at,
        o.updated_at as order_updated_at,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', oi.id,
                    'item_name', oi.item_name,
                    'quantity', oi.quantity,
                    'price', oi.price
                )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
        ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = user_uuid
    GROUP BY o.id, o.status, o.order_amount, o.created_at, o.updated_at
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all orders for staff
CREATE OR REPLACE FUNCTION get_all_orders()
RETURNS TABLE (
    order_id UUID,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    order_status VARCHAR(50),
    order_amount DECIMAL(10,2),
    order_created_at TIMESTAMP WITH TIME ZONE,
    order_updated_at TIMESTAMP WITH TIME ZONE,
    items JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as order_id,
        u.name as user_name,
        u.emailid as user_email,
        o.status as order_status,
        o.order_amount,
        o.created_at as order_created_at,
        o.updated_at as order_updated_at,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', oi.id,
                    'item_name', oi.item_name,
                    'quantity', oi.quantity,
                    'price', oi.price
                )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
        ) as items
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id, u.name, u.emailid, o.status, o.order_amount, o.created_at, o.updated_at
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SAMPLE DATA (OPTIONAL)
-- ========================================

-- Insert sample users
INSERT INTO users (id, name, emailid) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'John Doe', 'john@example.com'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Jane Smith', 'jane@example.com'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Admin User', 'admin@procol.in'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Staff User', 'staff@procol.in');

-- Insert sample orders
INSERT INTO orders (id, user_id, status, order_amount) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'pending', 150.00),
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'accepted', 200.00);

-- Insert sample order items
INSERT INTO order_items (order_id, item_name, quantity, price) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', 'Butter Chicken', 2, 75.00),
    ('660e8400-e29b-41d4-a716-446655440001', 'Paneer Tikka', 1, 120.00),
    ('660e8400-e29b-41d4-a716-446655440001', 'Naan', 2, 40.00);

-- Insert sample menu items (ORIGINAL VERSION ONLY)
INSERT INTO menu_items (id, name, price, description, image, category) VALUES
-- Hot Beverages
(1, 'Ginger Chai', 10.00, 'Hot ginger tea with aromatic spices', '/optimized/Ginger Tea.png', 'Hot Beverages'),
(2, 'Masala Chai', 10.00, 'Traditional Indian spiced tea', '/optimized/Ginger Tea.png', 'Hot Beverages'),

-- Cold Beverages
(35, 'Amul Chaas', 15.00, 'Refreshing buttermilk drink', '/optimized/Amul Chaas.png', 'Cold Beverages'),
(36, 'Amul Lassi', 20.00, 'Sweet and creamy yogurt drink', '/optimized/Amul Lassi.png', 'Cold Beverages'),
(37, 'Coca Cola', 40.00, 'Classic carbonated soft drink', '/optimized/Coca Cola.png', 'Cold Beverages'),

-- Breakfast Items
(3, 'Masala Oats', 20.00, 'Healthy oats with Indian spices', '/optimized/Masala Oats.png', 'Breakfast Items'),
(10, 'MTR Poha', 30.00, 'Flattened rice breakfast dish', '/optimized/MTR Poha.png', 'Breakfast Items'),
(11, 'MTR Upma', 30.00, 'Semolina breakfast porridge', '/optimized/MTR Upma.png', 'Breakfast Items'),
(15, 'Besan Chila', 30.00, 'Gram flour savory pancake', '/optimized/Besan Chila.png', 'Breakfast Items'),

-- Maggi Varieties
(4, 'Plain Maggi', 20.00, 'Classic instant noodles', '/optimized/Plain Maggi.png', 'Maggi Varieties'),
(5, 'Veg Butter Maggi', 30.00, 'Maggi with vegetables and butter', '/optimized/Veg butter maggi.png', 'Maggi Varieties'),
(6, 'Cheese Maggi', 30.00, 'Maggi topped with melted cheese', '/optimized/Cheese Maggi.png', 'Maggi Varieties'),
(7, 'Butter Atta Maggi', 30.00, 'Whole wheat Maggi with butter', '/optimized/Butter Atta Maggi.png', 'Maggi Varieties'),
(8, 'Veg Cheese Maggi', 40.00, 'Maggi with vegetables and cheese', '/optimized/Veg cheese maggi.png', 'Maggi Varieties'),
(9, 'Cheese Atta Maggi', 45.00, 'Whole wheat Maggi with cheese', '/optimized/Cheese Atta Maggi.png', 'Maggi Varieties'),

-- Sandwiches
(12, 'Veg Cheese Sandwich', 40.00, 'Vegetable and cheese sandwich', '/optimized/Veg Cheese Sandwich.png', 'Sandwiches'),
(13, 'Aloo Sandwich', 30.00, 'Potato sandwich with spices', '/optimized/Aloo sandwich.png', 'Sandwiches'),
(14, 'Aloo Cheese Sandwich', 45.00, 'Potato and cheese sandwich', '/optimized/Aloo cheese sandwich.png', 'Sandwiches'),

-- Main Course (ORIGINAL - only Pasta)
(22, 'Pasta', 40.00, 'Delicious Italian pasta with rich tomato sauce', '/optimized/Pasta.png', 'Main Course'),

-- Snacks & Namkeen
(16, 'Bhel Puri', 30.00, 'Tangy street food snack', '/optimized/Bhel Puri.png', 'Snacks & Namkeen'),
(30, 'Fatafat Bhel', 10.00, 'Quick and tangy bhel mixture', '/optimized/Fatafat Bhel.png', 'Snacks & Namkeen'),
(27, 'Aloo Bhujiya', 10.00, 'Crispy potato sev for snacking', '/optimized/Aloo Bhujia.png', 'Snacks & Namkeen'),
(31, 'Lite Mixture', 10.00, 'Light and crispy namkeen mixture', '/optimized/Lite Mixture.png', 'Snacks & Namkeen'),
(32, 'Moong Dal', 10.00, 'Roasted yellow moong dal', '/optimized/Moong Dal.png', 'Snacks & Namkeen'),
(33, 'Hing Chana', 10.00, 'Asafoetida flavored roasted chickpeas', '/optimized/Heeng Chana.png', 'Snacks & Namkeen'),
(28, 'Salted Peanut', 10.00, 'Roasted and salted peanuts', '/optimized/Salted Peanuts.png', 'Snacks & Namkeen'),
(29, 'Popcorn', 10.00, 'Freshly popped corn kernels', '/optimized/Popcorn.png', 'Snacks & Namkeen'),

-- Biscuits & Cookies
(24, 'Bourbon Biscuit', 10.00, 'Classic chocolate cream filled biscuits', '/optimized/Bourbon Biscuits.png', 'Biscuits & Cookies'),
(25, 'Good Day Biscuit', 10.00, 'Crunchy butter cookies with a delightful taste', '/optimized/Good Day Biscuit.png', 'Biscuits & Cookies'),
(26, 'Parle G Biscuit', 10.00, 'India''s favorite glucose biscuits', '/optimized/Parle G Biscuit.png', 'Biscuits & Cookies'),

-- Fresh Items
(17, 'Onion', 10.00, 'Fresh onions', '/optimized/Onion.png', 'Fresh Items'),
(18, 'Cucumber', 10.00, 'Fresh cucumbers', '/optimized/Cucumber.png', 'Fresh Items'),
(19, 'Mix Salad', 20.00, 'Fresh cut Cucumbers & Onion', '/optimized/Mix Salad.png', 'Fresh Items'),
(23, 'Cheese', 15.00, 'Fresh cheese cubes for snacking', '/optimized/Cheese.png', 'Fresh Items'),

-- Add-ons & Extras
(20, 'Gud', 5.00, 'Jaggery for natural sweetness', '/optimized/Gud.png', 'Add-ons & Extras'),
(21, 'Saunf', 5.00, 'Fennel seeds for digestion', '/optimized/Sauf.png', 'Add-ons & Extras'),
(34, 'Pass Pass', 2.00, 'Small candy for instant refreshment', '/optimized/Pass Pass.png', 'Add-ons & Extras');

-- Reset the sequence to continue from the highest ID
SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));

-- Create a view for available menu items
CREATE OR REPLACE VIEW available_menu_items AS
SELECT * FROM menu_items WHERE is_available = true;

-- Grant permissions
GRANT ALL ON menu_items TO authenticated;
GRANT SELECT ON available_menu_items TO anon;
GRANT SELECT ON available_menu_items TO authenticated;

-- ========================================
-- USAGE EXAMPLES
-- ========================================

/*
-- Get user's orders (run as authenticated user)
SELECT * FROM get_user_orders(auth.uid());

-- Get all orders (run as staff/admin)
SELECT * FROM get_all_orders();

-- Subscribe to realtime updates (in your frontend)
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order updated:', payload);
    }
  )
  .subscribe();

-- Update order status (staff only)
UPDATE orders 
SET status = 'accepted', updated_at = NOW() 
WHERE id = 'order-uuid-here';

-- Insert new order (authenticated user)
INSERT INTO orders (user_id, order_amount) 
VALUES (auth.uid(), 100.00) 
RETURNING id;

-- Insert order items
INSERT INTO order_items (order_id, item_name, quantity, price) 
VALUES 
  ('order-uuid-here', 'Chicken Biryani', 1, 80.00),
  ('order-uuid-here', 'Raita', 1, 20.00);
*/

