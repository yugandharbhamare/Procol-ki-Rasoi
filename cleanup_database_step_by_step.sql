-- Step-by-Step Database Cleanup Script
-- Run each section separately to avoid overwhelming the database
-- Run this in your Supabase SQL editor

-- ========================================
-- STEP 1: Check current state
-- ========================================
-- Run this first to see what needs to be fixed
SELECT 'Current Orders State' as info;
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id,
    COUNT(CASE WHEN custom_order_id IS NULL THEN 1 END) as null_custom_order_id,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
    COUNT(CASE WHEN order_amount IS NULL THEN 1 END) as null_order_amount
FROM orders;

SELECT 'Current Order Items State' as info;
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN order_id IS NULL THEN 1 END) as null_order_id,
    COUNT(CASE WHEN item_name IS NULL THEN 1 END) as null_item_name,
    COUNT(CASE WHEN quantity IS NULL THEN 1 END) as null_quantity,
    COUNT(CASE WHEN price IS NULL THEN 1 END) as null_price
FROM order_items;

-- ========================================
-- STEP 2: Fix custom_order_id
-- ========================================
-- Run this after step 1
UPDATE orders 
SET custom_order_id = 'ORD' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0')
WHERE custom_order_id IS NULL;

-- Verify the fix
SELECT 'After fixing custom_order_id' as info;
SELECT COUNT(*) as null_custom_order_id FROM orders WHERE custom_order_id IS NULL;

-- ========================================
-- STEP 3: Fix status
-- ========================================
-- Run this after step 2
UPDATE orders 
SET status = 'pending'
WHERE status IS NULL;

-- Verify the fix
SELECT 'After fixing status' as info;
SELECT COUNT(*) as null_status FROM orders WHERE status IS NULL;

-- ========================================
-- STEP 4: Fix order_items null values
-- ========================================
-- Run this after step 3
UPDATE order_items 
SET item_name = 'Unknown Item'
WHERE item_name IS NULL;

UPDATE order_items 
SET quantity = 1
WHERE quantity IS NULL;

UPDATE order_items 
SET price = 0
WHERE price IS NULL;

-- Verify the fix
SELECT 'After fixing order_items' as info;
SELECT 
    COUNT(CASE WHEN item_name IS NULL THEN 1 END) as null_item_name,
    COUNT(CASE WHEN quantity IS NULL THEN 1 END) as null_quantity,
    COUNT(CASE WHEN price IS NULL THEN 1 END) as null_price
FROM order_items;

-- ========================================
-- STEP 5: Remove orphaned order_items
-- ========================================
-- Run this after step 4
DELETE FROM order_items 
WHERE order_id NOT IN (SELECT id FROM orders);

-- Verify the fix
SELECT 'After removing orphaned items' as info;
SELECT COUNT(*) as orphaned_items FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- ========================================
-- STEP 6: Recalculate order amounts
-- ========================================
-- Run this after step 5
UPDATE orders 
SET order_amount = COALESCE(
    (SELECT SUM(oi.price * oi.quantity) 
     FROM order_items oi 
     WHERE oi.order_id = orders.id), 
    0
);

-- Verify the fix
SELECT 'After recalculating amounts' as info;
SELECT COUNT(*) as null_order_amount FROM orders WHERE order_amount IS NULL;

-- ========================================
-- STEP 7: Add constraints
-- ========================================
-- Run this last, after all data is fixed
ALTER TABLE orders ALTER COLUMN custom_order_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE orders ALTER COLUMN order_amount SET NOT NULL;

ALTER TABLE order_items ALTER COLUMN item_name SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN quantity SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN price SET NOT NULL;

-- ========================================
-- STEP 8: Final verification
-- ========================================
-- Run this to confirm everything is fixed
SELECT 'Final Orders State' as info;
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id,
    COUNT(CASE WHEN custom_order_id IS NULL THEN 1 END) as null_custom_order_id,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
    COUNT(CASE WHEN order_amount IS NULL THEN 1 END) as null_order_amount
FROM orders;

SELECT 'Final Order Items State' as info;
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN order_id IS NULL THEN 1 END) as null_order_id,
    COUNT(CASE WHEN item_name IS NULL THEN 1 END) as null_item_name,
    COUNT(CASE WHEN quantity IS NULL THEN 1 END) as null_quantity,
    COUNT(CASE WHEN price IS NULL THEN 1 END) as null_price
FROM order_items;

-- Show sample of cleaned data
SELECT 'Sample Cleaned Data' as info;
SELECT 
    o.custom_order_id,
    o.status,
    o.order_amount,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.custom_order_id, o.status, o.order_amount
ORDER BY o.created_at DESC 
LIMIT 5;
