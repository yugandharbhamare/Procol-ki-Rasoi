-- Minimal Supabase Setup - Just add the required columns
-- Run this script in your Supabase SQL Editor

-- 1. Add photo_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- 2. Add user columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_photo_url VARCHAR(500);

-- 3. Make user_id nullable in orders table
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 4. Success message
SELECT '✅ Columns added successfully!' as status;
