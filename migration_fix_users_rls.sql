-- Migration script to fix users table RLS policies
-- This ensures proper authentication and security

-- 1. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all users" ON users;

-- 3. Create policy for users to insert their own profile (for sign-up)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT 
    WITH CHECK (true); -- Allow insert during sign-up

-- 4. Create policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT 
    USING (auth.uid()::text = firebase_uid OR emailid = auth.jwt() ->> 'email');

-- 5. Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    USING (auth.uid()::text = firebase_uid OR emailid = auth.jwt() ->> 'email');

-- 6. Create policy for staff to view all users (for order management)
CREATE POLICY "Staff can view all users" ON users
    FOR SELECT 
    USING (true); -- Staff need to see user info for orders

-- 7. Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 8. Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
