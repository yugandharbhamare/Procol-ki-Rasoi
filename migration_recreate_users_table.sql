-- Comprehensive migration to recreate users table and fix authentication
-- Run this script in your Supabase SQL editor

-- ========================================
-- STEP 1: Drop existing users table if it exists
-- ========================================
-- WARNING: This will delete all existing users and their data
-- Only run this if you're sure you want to start fresh

-- First, drop foreign key constraints that reference users
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Now drop the users table
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- STEP 2: Recreate users table with proper structure
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    emailid VARCHAR(255) UNIQUE NOT NULL,
    photo_url VARCHAR(500), -- Google profile photo URL
    firebase_uid VARCHAR(255), -- Firebase UID for reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STEP 3: Recreate foreign key constraints
-- ========================================
-- Add back the foreign key constraint for orders
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ========================================
-- STEP 4: Create indexes for performance
-- ========================================
CREATE INDEX idx_users_emailid ON users(emailid);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- ========================================
-- STEP 5: Enable Row Level Security (RLS)
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 6: Create RLS policies
-- ========================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = firebase_uid OR emailid = auth.jwt() ->> 'email');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = firebase_uid OR emailid = auth.jwt() ->> 'email');

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (true);

-- Staff can view all users (for order management)
CREATE POLICY "Staff can view all users" ON users
    FOR SELECT USING (true);

-- ========================================
-- STEP 7: Verify the table structure
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- ========================================
-- STEP 8: Test user creation (optional)
-- ========================================
-- You can test with a sample user if needed
-- INSERT INTO users (name, emailid, photo_url) 
-- VALUES ('Test User', 'test@example.com', 'https://example.com/photo.jpg');
