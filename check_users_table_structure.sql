-- Check the current structure of the users table
-- This will help us understand what columns exist and their data

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users';

-- Check current user data
SELECT 
    id,
    emailid,
    name,
    is_admin,
    is_staff,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Check for yugandhar.bhamare@gmail.com specifically
SELECT 
    id,
    emailid,
    name,
    is_admin,
    is_staff,
    created_at
FROM users 
WHERE emailid = 'yugandhar.bhamare@gmail.com';
