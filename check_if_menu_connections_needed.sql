-- Check if Menu Connections are Actually Needed
-- This script helps you decide whether to keep or remove menu connections
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. ANALYZE CURRENT USAGE
-- ========================================

-- Check how many orders actually have menu items
SELECT 
    'Current Order Analysis' as info,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT oi.id) as total_order_items,
    COUNT(DISTINCT mi.id) as total_menu_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.item_name = mi.name AND oi.price = mi.price;

-- ========================================
-- 2. CHECK IF MENU ITEMS ARE BEING USED
-- ========================================

-- See if menu items are actually referenced in orders
SELECT 
    'Menu Item Usage' as info,
    mi.name as menu_item_name,
    mi.category,
    COUNT(oi.id) as times_ordered,
    mi.is_available
FROM menu_items mi
LEFT JOIN order_items oi ON mi.name = oi.item_name AND mi.price = oi.price
GROUP BY mi.id, mi.name, mi.category, mi.is_available
ORDER BY times_ordered DESC
LIMIT 10;

-- ========================================
-- 3. CHECK ORDER ITEM PATTERNS
-- ========================================

-- See what kind of items are being ordered
SELECT 
    'Order Item Patterns' as info,
    oi.item_name,
    COUNT(*) as times_ordered,
    AVG(oi.quantity) as avg_quantity,
    AVG(oi.price) as avg_price
FROM order_items oi
GROUP BY oi.item_name, oi.price
ORDER BY times_ordered DESC
LIMIT 10;

-- ========================================
-- 4. RECOMMENDATION
-- ========================================

-- Based on the analysis above, here's what you should consider:

/*
RECOMMENDATION LOGIC:

1. If most order items match menu items by name/price:
   → KEEP menu connections (add menu_item_id column)

2. If order items are mostly custom/different from menu:
   → REMOVE menu connections (current setup is fine)

3. If you want to track inventory/availability:
   → KEEP menu connections for better management

4. If you want simple, flexible ordering:
   → REMOVE menu connections for simplicity
*/

-- ========================================
-- 5. SIMPLE ALTERNATIVE APPROACH
-- ========================================

-- If you don't need menu connections, you can still get menu-like data:
SELECT 
    'Alternative: Menu-like Data from Orders' as info,
    oi.item_name,
    COUNT(*) as popularity,
    AVG(oi.price) as avg_price,
    MIN(oi.price) as min_price,
    MAX(oi.price) as max_price
FROM order_items oi
GROUP BY oi.item_name
HAVING COUNT(*) > 1
ORDER BY popularity DESC
LIMIT 10;
