-- Test script to verify database connection and table structure
-- Run this in your Supabase SQL editor to check if everything is working

-- ========================================
-- TEST 1: Check if we can connect to the database
-- ========================================
SELECT 'Database connection successful' as status, NOW() as timestamp;

-- ========================================
-- TEST 2: Check if the users table exists
-- ========================================
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'Users table exists' 
        ELSE 'Users table does NOT exist' 
    END as table_status;

-- ========================================
-- TEST 3: Check users table structure (if it exists)
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
-- TEST 4: Check if orders table exists
-- ========================================
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') 
        THEN 'Orders table exists' 
        ELSE 'Orders table does NOT exist' 
    END as table_status;

-- ========================================
-- TEST 5: Check orders table structure (if it exists)
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- ========================================
-- TEST 6: Check if we can insert a test user
-- ========================================
-- This will only work if the users table exists and has the right structure
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Try to insert a test user
        INSERT INTO users (name, emailid, photo_url) 
        VALUES ('Test User', 'test@example.com', 'https://example.com/photo.jpg')
        ON CONFLICT (emailid) DO NOTHING;
        
        RAISE NOTICE 'Test user insertion successful';
    ELSE
        RAISE NOTICE 'Cannot test user insertion - users table does not exist';
    END IF;
END $$;

-- ========================================
-- TEST 7: Check current user count
-- ========================================
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
        THEN (SELECT COUNT(*) FROM users)::text
        ELSE 'N/A - table does not exist'
    END as user_count;
