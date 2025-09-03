-- Simple migration to add missing columns to users table
-- Run each command separately in your Supabase SQL editor

-- STEP 1: Add photo_url column
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- STEP 2: Add firebase_uid column  
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255);

-- STEP 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- STEP 4: Verify the columns were added
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- STEP 5: Check current user data
SELECT name, emailid, photo_url, firebase_uid FROM users LIMIT 5;
