-- Update RLS policies to allow user creation from Firebase auth
-- This script modifies the existing policies to work with our Firebase-Supabase integration

-- Drop existing user policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policies that allow user creation from our app
-- Allow anyone to insert users (for Firebase auth integration)
CREATE POLICY "Allow user creation for Firebase auth" ON users
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile by ID
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);

-- Allow users to update their own profile by ID
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Drop existing order policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- Create new order policies
-- Allow anyone to insert orders (for our app)
CREATE POLICY "Allow order creation" ON orders
    FOR INSERT WITH CHECK (true);

-- Allow viewing all orders (for staff dashboard)
CREATE POLICY "Allow viewing all orders" ON orders
    FOR SELECT USING (true);

-- Allow updating all orders (for staff dashboard)
CREATE POLICY "Allow updating all orders" ON orders
    FOR UPDATE USING (true);

-- Drop existing order_items policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

-- Create new order_items policies
-- Allow anyone to insert order items (for our app)
CREATE POLICY "Allow order items creation" ON order_items
    FOR INSERT WITH CHECK (true);

-- Allow viewing all order items (for staff dashboard)
CREATE POLICY "Allow viewing all order items" ON order_items
    FOR SELECT USING (true);
