-- Migration script to add missing columns to existing users table
-- This script ONLY adds columns, it doesn't recreate the table

-- 1. Add photo_url column to users table (if it doesn't exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- 2. Add firebase_uid column to users table (if it doesn't exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255);

-- 3. Create index on firebase_uid for performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- 4. Verification: Check the updated table structure
-- Run this to verify the columns were added:
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. Check if any existing users have photo_url data
-- Run this to see current user data:
SELECT 
    id,
    name,
    emailid,
    photo_url,
    firebase_uid,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
