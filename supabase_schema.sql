-- Supabase Schema for Food Ordering System
-- This schema includes users, orders, order_items tables with RLS and realtime subscriptions

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
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_users_emailid ON users(emailid);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

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

-- Users can update their own orders (for status changes)
CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Staff can view all orders (for admin/staff portal)
CREATE POLICY "Staff can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.emailid IN (
                'admin@procol.in',
                'staff@procol.in',
                'kitchen@procol.in',
                'manager@procol.in'
            )
        )
    );

-- Staff can update all orders (for status changes)
CREATE POLICY "Staff can update all orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.emailid IN (
                'admin@procol.in',
                'staff@procol.in',
                'kitchen@procol.in',
                'manager@procol.in'
            )
        )
    );

-- ========================================
-- ORDER_ITEMS RLS POLICIES
-- ========================================

-- Users can view items from their own orders
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Users can insert items for their own orders
CREATE POLICY "Users can insert own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Staff can view all order items
CREATE POLICY "Staff can view all order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.emailid IN (
                'admin@procol.in',
                'staff@procol.in',
                'kitchen@procol.in',
                'manager@procol.in'
            )
        )
    );

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

