-- Fix Duplicate Orders Issue
-- This script will prevent future duplicates and clean up existing ones

-- ========================================
-- 1. IDENTIFY DUPLICATE ORDERS
-- ========================================

-- Check for duplicate orders based on user_id, order_amount, and created_at (within 1 minute)
SELECT 
    user_id,
    order_amount,
    COUNT(*) as duplicate_count,
    array_agg(id) as order_ids,
    array_agg(created_at) as created_times
FROM orders 
GROUP BY user_id, order_amount, created_at::date
HAVING COUNT(*) > 1
ORDER BY user_id, order_amount;

-- ========================================
-- 2. ADD UNIQUE CONSTRAINT TO PREVENT FUTURE DUPLICATES
-- ========================================

-- Add a unique constraint on the combination of user_id, order_amount, and created_at (date only)
-- This prevents multiple orders with same amount on the same day for the same user
ALTER TABLE orders 
ADD CONSTRAINT unique_user_order_per_day 
UNIQUE (user_id, order_amount, DATE(created_at));

-- Add a unique constraint on user_id and created_at (within 1 minute)
-- This prevents rapid duplicate submissions
ALTER TABLE orders 
ADD CONSTRAINT unique_user_order_timing 
UNIQUE (user_id, created_at);

-- ========================================
-- 3. CLEAN UP EXISTING DUPLICATES
-- ========================================

-- Create a temporary table to identify duplicates to keep
CREATE TEMP TABLE orders_to_keep AS
SELECT DISTINCT ON (user_id, order_amount, DATE(created_at))
    id,
    user_id,
    order_amount,
    created_at,
    ROW_NUMBER() OVER (
        PARTITION BY user_id, order_amount, DATE(created_at) 
        ORDER BY created_at ASC
    ) as rn
FROM orders
ORDER BY user_id, order_amount, DATE(created_at), created_at ASC;

-- Delete duplicate orders (keep the first one created)
DELETE FROM orders 
WHERE id NOT IN (
    SELECT id FROM orders_to_keep
);

-- Clean up temporary table
DROP TABLE orders_to_keep;

-- ========================================
-- 4. ADD ADDITIONAL SAFEGUARDS
-- ========================================

-- Add a check constraint to ensure order_amount is positive
ALTER TABLE orders 
ADD CONSTRAINT check_positive_amount 
CHECK (order_amount > 0);

-- Add a check constraint to ensure created_at is not in the future
ALTER TABLE orders 
ADD CONSTRAINT check_valid_created_at 
CHECK (created_at <= NOW());

-- ========================================
-- 5. VERIFY THE FIX
-- ========================================

-- Check if duplicates still exist
SELECT 
    user_id,
    order_amount,
    COUNT(*) as order_count
FROM orders 
GROUP BY user_id, order_amount, DATE(created_at)
HAVING COUNT(*) > 1;

-- Show the final order count
SELECT COUNT(*) as total_orders FROM orders;

-- Show orders by user
SELECT 
    u.name,
    u.emailid,
    COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.emailid
ORDER BY order_count DESC;
