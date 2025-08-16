-- Fix orders table schema to allow nullable user_id
-- This allows orders to be created even if user is not found in Supabase

-- Make user_id nullable in orders table
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Add a comment to explain why user_id can be null
COMMENT ON COLUMN orders.user_id IS 'Can be null if user is not found in Supabase users table (e.g., Firebase auth user not synced)';

-- Update RLS policies to handle nullable user_id
-- Drop existing order policies
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Allow viewing all orders" ON orders;
DROP POLICY IF EXISTS "Allow updating all orders" ON orders;

-- Create new order policies that allow orders with or without user_id
CREATE POLICY "Allow order creation" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing all orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Allow updating all orders" ON orders
    FOR UPDATE USING (true);

-- Drop existing order_items policies
DROP POLICY IF EXISTS "Allow order items creation" ON order_items;
DROP POLICY IF EXISTS "Allow viewing all order items" ON order_items;

-- Create new order_items policies
CREATE POLICY "Allow order items creation" ON order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing all order items" ON order_items
    FOR SELECT USING (true);
