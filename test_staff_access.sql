-- Test script to check staff access in the database
-- Run this in Supabase SQL editor to verify staff users

-- Check if is_staff and is_admin columns exist
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('is_staff', 'is_admin');

-- Check all users and their staff/admin status
SELECT 
    id,
    emailid,
    name,
    is_staff,
    is_admin,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Check specifically for staff users
SELECT 
    id,
    emailid,
    name,
    is_staff,
    is_admin
FROM users 
WHERE is_staff = true OR is_admin = true;

-- Check for users who should be staff but aren't marked
SELECT 
    id,
    emailid,
    name,
    is_staff,
    is_admin
FROM users 
WHERE emailid IN ('yugandhar.bhamare@gmail.com', 'design@procol.in')
AND (is_staff = false OR is_staff IS NULL);
