-- Simple Duplicate Orders Cleanup
-- This script will remove duplicate orders without complex constraints

-- ========================================
-- 1. SHOW CURRENT DUPLICATES
-- ========================================

-- Display all duplicate orders found
SELECT 
    'DUPLICATES FOUND:' as message,
    user_id,
    order_amount,
    COUNT(*) as duplicate_count,
    array_agg(id) as order_ids,
    array_agg(created_at) as created_times
FROM orders 
GROUP BY user_id, order_amount, DATE(created_at)
HAVING COUNT(*) > 1
ORDER BY user_id, order_amount;

-- ========================================
-- 2. SHOW ORDERS TO BE DELETED
-- ========================================

-- Show which specific orders will be deleted
WITH duplicate_orders AS (
    SELECT 
        id,
        user_id,
        order_amount,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, order_amount, DATE(created_at) 
            ORDER BY created_at ASC
        ) as rn
    FROM orders
)
SELECT 
    'TO DELETE:' as message,
    id,
    user_id,
    order_amount,
    created_at
FROM duplicate_orders 
WHERE rn > 1
ORDER BY user_id, created_at;

-- ========================================
-- 3. DELETE DUPLICATE ORDER ITEMS
-- ========================================

-- Remove order items for duplicate orders first
WITH duplicate_orders AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, order_amount, DATE(created_at) 
            ORDER BY created_at ASC
        ) as rn
    FROM orders
)
DELETE FROM order_items 
WHERE order_id IN (
    SELECT id FROM duplicate_orders WHERE rn > 1
);

-- ========================================
-- 4. DELETE DUPLICATE ORDERS
-- ========================================

-- Remove duplicate orders (keep the first one)
WITH duplicate_orders AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, order_amount, DATE(created_at) 
            ORDER BY created_at ASC
        ) as rn
    FROM orders
)
DELETE FROM orders 
WHERE id IN (
    SELECT id FROM duplicate_orders WHERE rn > 1
);

-- ========================================
-- 5. VERIFY CLEANUP
-- ========================================

-- Check if duplicates still exist
SELECT 
    'VERIFICATION:' as message,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO DUPLICATES FOUND - SUCCESS!'
        ELSE 'DUPLICATES STILL EXIST - COUNT: ' || COUNT(*)
    END as status
FROM (
    SELECT user_id, order_amount, DATE(created_at) as order_date
    FROM orders 
    GROUP BY user_id, order_amount, DATE(created_at)
    HAVING COUNT(*) > 1
) duplicates;

-- Show final order count
SELECT 
    'FINAL COUNT:' as message,
    COUNT(*) as total_orders
FROM orders;

-- Show orders by user
SELECT 
    'BY USER:' as message,
    u.name,
    u.emailid,
    COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.emailid
ORDER BY order_count DESC;
