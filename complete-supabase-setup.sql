-- Complete Supabase Setup for Procol ki Rasoi
-- Run this script in your Supabase SQL Editor

-- 1. Add photo_url column to users table for Google profile photos
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
COMMENT ON COLUMN users.photo_url IS 'Google profile photo URL for user identification';
CREATE INDEX IF NOT EXISTS idx_users_photo_url ON users(photo_url);

-- 2. Add user_name and user_email columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_photo_url VARCHAR(500);

-- Add comments to explain the columns
COMMENT ON COLUMN orders.user_name IS 'Name of the user who created this order';
COMMENT ON COLUMN orders.user_email IS 'Email of the user who created this order';
COMMENT ON COLUMN orders.user_photo_url IS 'User profile photo URL for display in order cards';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_name ON orders(user_name);
CREATE INDEX IF NOT EXISTS idx_orders_user_photo_url ON orders(user_photo_url);

-- 3. Make user_id nullable in orders table (for Firebase auth users)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
COMMENT ON COLUMN orders.user_id IS 'Can be null if user is not found in Supabase users table (e.g., Firebase auth user not synced)';

-- 4. Update RLS policies to allow order creation from the app
-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

-- Create new user policies
CREATE POLICY "Allow user creation for Firebase auth" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Create new order policies
CREATE POLICY "Allow order creation" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing all orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Allow updating all orders" ON orders
    FOR UPDATE USING (true);

-- Create new order_items policies
CREATE POLICY "Allow order items creation" ON order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing all order items" ON order_items
    FOR SELECT USING (true);

-- 5. Update existing orders with user information if possible
-- This will populate user_name and user_email from the users table based on user_id
UPDATE orders 
SET 
  user_name = users.name,
  user_email = users.emailid
FROM users 
WHERE orders.user_id = users.id 
  AND orders.user_name IS NULL 
  AND orders.user_email IS NULL;

-- 6. Verify the setup
SELECT 
  'Users table columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('photo_url', 'name', 'emailid', 'firebase_uid')
ORDER BY column_name;

SELECT 
  'Orders table columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('user_name', 'user_email', 'user_photo_url', 'user_id')
ORDER BY column_name;

-- 7. Show current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('users', 'orders', 'order_items')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ Supabase setup completed successfully!' as status;
