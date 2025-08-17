-- Check for null values in critical columns
-- Run this script in your Supabase SQL Editor to identify data integrity issues

-- Check orders table for null values
SELECT 
  'orders' as table_name,
  'user_name' as column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders) as null_percentage
FROM orders 
WHERE user_name IS NULL

UNION ALL

SELECT 
  'orders' as table_name,
  'user_email' as column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders) as null_percentage
FROM orders 
WHERE user_email IS NULL

UNION ALL

SELECT 
  'orders' as column_name,
  'custom_order_id' as column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders) as null_percentage
FROM orders 
WHERE custom_order_id IS NULL

UNION ALL

SELECT 
  'orders' as table_name,
  'order_amount' as column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders) as null_percentage
FROM orders 
WHERE order_amount IS NULL;

-- Check order_items table for null values
SELECT 
  'order_items' as table_name,
  'item_amount' as column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM order_items) as null_percentage
FROM order_items 
WHERE item_amount IS NULL

UNION ALL

SELECT 
  'order_items' as table_name,
  'ordered_by' as column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM order_items) as null_percentage
FROM order_items 
WHERE ordered_by IS NULL

UNION ALL

SELECT 
  'order_items' as table_name,
  'order_status' as column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM order_items) as null_percentage
FROM order_items 
WHERE order_status IS NULL

UNION ALL

SELECT 
  'order_items' as table_name,
  'custom_order_id' as column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM order_items) as null_percentage
FROM order_items 
WHERE custom_order_id IS NULL;
