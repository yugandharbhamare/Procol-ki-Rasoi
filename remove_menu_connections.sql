-- Remove Menu Item Connections from Order Items Table
-- This script removes the menu_item_id column and related connections if not needed
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. CHECK CURRENT STATUS FIRST
-- ========================================

-- See what we currently have
SELECT 
    'Before Cleanup' as status,
    COUNT(*) as total_order_items,
    COUNT(menu_item_id) as linked_to_menu,
    COUNT(*) - COUNT(menu_item_id) as unlinked_items
FROM order_items;

-- ========================================
-- 2. REMOVE THE MENU_ITEM_ID COLUMN
-- ========================================

-- Remove the menu_item_id column from order_items table
ALTER TABLE order_items 
DROP COLUMN IF EXISTS menu_item_id;

-- ========================================
-- 3. REMOVE THE INDEX (if it exists)
-- ========================================

-- Remove the index for menu_item_id
DROP INDEX IF EXISTS idx_order_items_menu_item_id;

-- ========================================
-- 4. VERIFY CLEANUP
-- ========================================

-- Check the table structure after cleanup
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- Show sample of order_items after cleanup
SELECT 
    id,
    order_id,
    item_name,
    quantity,
    price,
    created_at
FROM order_items
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 5. FINAL STATUS CHECK
-- ========================================

-- Confirm the cleanup was successful
SELECT 
    'After Cleanup' as status,
    COUNT(*) as total_order_items,
    'Menu connections removed' as note
FROM order_items;
