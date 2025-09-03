-- Database Cleanup Script for Orders and Order Items
-- This script fixes null values and data integrity issues
-- Run this in your Supabase SQL editor

-- ========================================
-- STEP 1: Check current state of tables
-- ========================================
-- Check orders table structure and data
SELECT 'Orders Table Structure' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check for null values in orders table
SELECT 'Orders with NULL values' as info;
SELECT 
    id,
    user_id,
    custom_order_id,
    status,
    order_amount,
    created_at,
    updated_at
FROM orders 
WHERE user_id IS NULL 
   OR custom_order_id IS NULL 
   OR status IS NULL 
   OR order_amount IS NULL
LIMIT 10;

-- Check order_items table structure
SELECT 'Order Items Table Structure' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;

-- Check for null values in order_items table
SELECT 'Order Items with NULL values' as info;
SELECT 
    id,
    order_id,
    item_name,
    quantity,
    price,
    created_at
FROM order_items 
WHERE order_id IS NULL 
   OR item_name IS NULL 
   OR quantity IS NULL 
   OR price IS NULL
LIMIT 10;

-- ========================================
-- STEP 2: Fix orders table null values
-- ========================================

-- Update orders with null custom_order_id
UPDATE orders 
SET custom_order_id = 'ORD' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0')
WHERE custom_order_id IS NULL;

-- Update orders with null status
UPDATE orders 
SET status = 'pending'
WHERE status IS NULL;

-- Update orders with null order_amount (set to 0 if no items)
UPDATE orders 
SET order_amount = COALESCE(
    (SELECT SUM(oi.price * oi.quantity) 
     FROM order_items oi 
     WHERE oi.order_id = orders.id), 
    0
)
WHERE order_amount IS NULL;

-- ========================================
-- STEP 3: Fix order_items table null values
-- ========================================

-- Update order_items with null item_name
UPDATE order_items 
SET item_name = 'Unknown Item'
WHERE item_name IS NULL;

-- Update order_items with null quantity
UPDATE order_items 
SET quantity = 1
WHERE quantity IS NULL;

-- Update order_items with null price
UPDATE order_items 
SET price = 0
WHERE price IS NULL;

-- ========================================
-- STEP 4: Fix orphaned order_items
-- ========================================

-- Find order_items that reference non-existent orders
SELECT 'Orphaned order_items' as info;
SELECT oi.id, oi.order_id
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- Delete orphaned order_items
DELETE FROM order_items 
WHERE order_id NOT IN (SELECT id FROM orders);

-- ========================================
-- STEP 5: Fix orders with no items
-- ========================================

-- Find orders with no items
SELECT 'Orders with no items' as info;
SELECT o.id, o.custom_order_id, o.status, o.order_amount
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE oi.id IS NULL;

-- Update order_amount for orders with no items
UPDATE orders 
SET order_amount = 0
WHERE id NOT IN (
    SELECT DISTINCT order_id 
    FROM order_items 
    WHERE order_id IS NOT NULL
);

-- ========================================
-- STEP 6: Recalculate order amounts
-- ========================================

-- Update all order amounts based on their items
UPDATE orders 
SET order_amount = COALESCE(
    (SELECT SUM(oi.price * oi.quantity) 
     FROM order_items oi 
     WHERE oi.order_id = orders.id), 
    0
);

-- ========================================
-- STEP 7: Add missing constraints
-- ========================================

-- Make sure custom_order_id is NOT NULL
ALTER TABLE orders ALTER COLUMN custom_order_id SET NOT NULL;

-- Make sure status is NOT NULL
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;

-- Make sure order_amount is NOT NULL
ALTER TABLE orders ALTER COLUMN order_amount SET NOT NULL;

-- Make sure item_name is NOT NULL
ALTER TABLE order_items ALTER COLUMN item_name SET NOT NULL;

-- Make sure quantity is NOT NULL
ALTER TABLE order_items ALTER COLUMN quantity SET NOT NULL;

-- Make sure price is NOT NULL
ALTER TABLE order_items ALTER COLUMN price SET NOT NULL;

-- ========================================
-- STEP 8: Verify the fixes
-- ========================================

-- Check final state of orders table
SELECT 'Final Orders State' as info;
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id,
    COUNT(CASE WHEN custom_order_id IS NULL THEN 1 END) as null_custom_order_id,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
    COUNT(CASE WHEN order_amount IS NULL THEN 1 END) as null_order_amount
FROM orders;

-- Check final state of order_items table
SELECT 'Final Order Items State' as info;
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN order_id IS NULL THEN 1 END) as null_order_id,
    COUNT(CASE WHEN item_name IS NULL THEN 1 END) as null_item_name,
    COUNT(CASE WHEN quantity IS NULL THEN 1 END) as null_quantity,
    COUNT(CASE WHEN price IS NULL THEN 1 END) as null_price
FROM order_items;

-- Show sample of cleaned data
SELECT 'Sample Cleaned Orders' as info;
SELECT 
    id,
    custom_order_id,
    status,
    order_amount,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Sample Cleaned Order Items' as info;
SELECT 
    id,
    order_id,
    item_name,
    quantity,
    price
FROM order_items 
ORDER BY created_at DESC 
LIMIT 5;
