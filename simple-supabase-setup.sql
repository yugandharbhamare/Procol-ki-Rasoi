-- Simple Supabase Setup for Procol ki Rasoi
-- Run this script in your Supabase SQL Editor

-- 1. Add photo_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- 2. Add user columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_photo_url VARCHAR(500);

-- 3. Make user_id nullable in orders table
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_photo_url ON users(photo_url);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_name ON orders(user_name);
CREATE INDEX IF NOT EXISTS idx_orders_user_photo_url ON orders(user_photo_url);

-- 5. Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

-- 6. Create new policies one by one
CREATE POLICY "Allow user creation for Firebase auth" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow order creation" ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing all orders" ON orders FOR SELECT USING (true);

CREATE POLICY "Allow updating all orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Allow order items creation" ON order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing all order items" ON order_items FOR SELECT USING (true);

-- 7. Success message
SELECT '✅ Supabase setup completed successfully!' as status;
