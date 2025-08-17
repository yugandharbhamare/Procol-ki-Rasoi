-- Fix null values in critical columns
-- Run this script in your Supabase SQL Editor to ensure data integrity

-- Fix null values in orders table
UPDATE orders 
SET 
  user_name = COALESCE(user_name, 'Unknown User'),
  user_email = COALESCE(user_email, 'no-email@example.com'),
  order_amount = COALESCE(order_amount, 0)
WHERE 
  user_name IS NULL 
  OR user_email IS NULL 
  OR order_amount IS NULL;

-- Fix null values in order_items table
UPDATE order_items 
SET 
  item_amount = COALESCE(item_amount, price * quantity),
  ordered_by = COALESCE(ordered_by, 'Unknown User'),
  order_status = COALESCE(order_status, 'pending')
WHERE 
  item_amount IS NULL 
  OR ordered_by IS NULL 
  OR order_status IS NULL;

-- Update order_items with missing custom_order_id from orders table
UPDATE order_items 
SET custom_order_id = orders.custom_order_id
FROM orders 
WHERE order_items.order_id = orders.id 
  AND order_items.custom_order_id IS NULL 
  AND orders.custom_order_id IS NOT NULL;

-- Set default custom_order_id for any remaining null values
UPDATE order_items 
SET custom_order_id = 'ORD' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE custom_order_id IS NULL;

-- Success message
SELECT '✅ Null values fixed successfully!' as status;
