-- EMERGENCY FIX for Foreign Key Constraint Error
-- Run this immediately to fix the "orders_user_id_fkey" error
-- This is a quick fix - run the comprehensive script later

-- ========================================
-- QUICK FIX: Create missing users
-- ========================================

-- Step 1: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    emailid VARCHAR(255) UNIQUE NOT NULL,
    photo_url VARCHAR(500),
    firebase_uid VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert users for all orders that have user_id
INSERT INTO users (id, name, emailid, photo_url, firebase_uid, created_at)
SELECT DISTINCT
    o.user_id,
    'User ' || SUBSTRING(o.user_id::TEXT, 1, 8) as name,
    'user_' || SUBSTRING(o.user_id::TEXT, 1, 8) || '@procol-ki-rasoi.com' as emailid,
    NULL as photo_url,
    NULL as firebase_uid,
    COALESCE(o.created_at, NOW()) as created_at
FROM orders o
WHERE o.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create a system user for any orders without user_id
INSERT INTO users (id, name, emailid, photo_url, firebase_uid, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'System User',
    'system@procol-ki-rasoi.com',
    NULL,
    NULL,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Update any orders without user_id to use system user
UPDATE orders 
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

-- Step 5: Verify the fix
SELECT 'Fix Verification' as info;
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id
FROM orders;

SELECT 'Users Created' as info;
SELECT COUNT(*) as total_users FROM users;

-- Step 6: Test the constraint
SELECT 'Testing Foreign Key' as info;
SELECT 
    o.id,
    o.custom_order_id,
    u.name as user_name
FROM orders o
JOIN users u ON o.user_id = u.id
LIMIT 3;

-- If you see results above, the fix worked!
-- Now you can run the comprehensive cleanup scripts
