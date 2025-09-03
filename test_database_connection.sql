-- Test script to verify database connection and table structure
-- Run this in your Supabase SQL editor to check if everything is working

-- 1. Check if users table exists and has the right structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check if the table has any data
SELECT COUNT(*) as user_count FROM users;

-- 3. Check if we can insert a test user
INSERT INTO users (name, emailid, firebase_uid, photo_url) 
VALUES ('Test User', 'test@example.com', 'test-uid-123', 'https://example.com/photo.jpg')
RETURNING *;

-- 4. Check if the test user was created
SELECT * FROM users WHERE emailid = 'test@example.com';

-- 5. Clean up the test user
DELETE FROM users WHERE emailid = 'test@example.com';

-- 6. Verify the test user was deleted
SELECT COUNT(*) as user_count FROM users;
