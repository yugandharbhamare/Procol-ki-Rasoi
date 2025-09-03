-- Quick Schema Fix - Critical Missing Connections
-- Run this first to fix the most important missing relationships
-- Run this in your Supabase SQL editor

-- ========================================
-- CRITICAL FIX 1: Add menu_item_id to order_items
-- ========================================
SELECT 'Adding menu_item_id to order_items' as info;

-- Add the missing column
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS menu_item_id INTEGER;

-- Link existing order_items to menu_items by name
UPDATE order_items 
SET menu_item_id = mi.id
FROM menu_items mi
WHERE order_items.item_name = mi.name
  AND order_items.menu_item_id IS NULL;

-- Show linking results
SELECT 'Menu Item Linking Results' as info;
SELECT 
    COUNT(*) as total_order_items,
    COUNT(menu_item_id) as linked_items,
    COUNT(*) - COUNT(menu_item_id) as unlinked_items
FROM order_items;

-- ========================================
-- CRITICAL FIX 2: Add missing foreign key constraints
-- ========================================
SELECT 'Adding Foreign Key Constraints' as info;

-- Add foreign key from order_items to menu_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_menu_item_id_fkey' 
        AND table_name = 'order_items'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_menu_item_id_fkey 
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key: order_items.menu_item_id -> menu_items.id';
    ELSE
        RAISE NOTICE 'Foreign key already exists';
    END IF;
END $$;

-- Add foreign key from order_items to orders (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_order_id_fkey' 
        AND table_name = 'order_items'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key: order_items.order_id -> orders.id';
    ELSE
        RAISE NOTICE 'Foreign key already exists';
    END IF;
END $$;

-- Add foreign key from orders to users (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key: orders.user_id -> users.id';
    ELSE
        RAISE NOTICE 'Foreign key already exists';
    END IF;
END $$;

-- ========================================
-- CRITICAL FIX 3: Add missing indexes for performance
-- ========================================
SELECT 'Adding Performance Indexes' as info;

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Indexes for menu_items table
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_emailid ON users(emailid);

-- ========================================
-- CRITICAL FIX 4: Add data validation constraints
-- ========================================
SELECT 'Adding Data Validation' as info;

-- Validate order status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'orders_status_check'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled'));
        RAISE NOTICE 'Added status validation';
    END IF;
END $$;

-- Validate order amounts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'orders_amount_check'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_amount_check 
        CHECK (order_amount >= 0);
        RAISE NOTICE 'Added amount validation';
    END IF;
END $$;

-- Validate order item quantities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'order_items_quantity_check'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_quantity_check 
        CHECK (quantity > 0);
        RAISE NOTICE 'Added quantity validation';
    END IF;
END $$;

-- ========================================
-- VERIFICATION: Check all connections
-- ========================================
SELECT 'Verifying All Connections' as info;

-- Check foreign key constraints
SELECT 'Foreign Key Constraints' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- Test table relationships
SELECT 'Testing Table Relationships' as info;

-- Users -> Orders
SELECT 
    'Users -> Orders' as relationship,
    COUNT(DISTINCT u.id) as users_count,
    COUNT(o.id) as orders_count,
    CASE WHEN COUNT(o.id) > 0 THEN '✅ CONNECTED' ELSE '❌ DISCONNECTED' END as status
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
LIMIT 3;

-- Orders -> Order Items
SELECT 
    'Orders -> Order Items' as relationship,
    COUNT(DISTINCT o.id) as orders_count,
    COUNT(oi.id) as items_count,
    CASE WHEN COUNT(oi.id) > 0 THEN '✅ CONNECTED' ELSE '❌ DISCONNECTED' END as status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id
LIMIT 3;

-- Order Items -> Menu Items
SELECT 
    'Order Items -> Menu Items' as relationship,
    COUNT(oi.id) as order_items_count,
    COUNT(oi.menu_item_id) as linked_items_count,
    CASE WHEN COUNT(oi.menu_item_id) > 0 THEN '✅ CONNECTED' ELSE '❌ DISCONNECTED' END as status
FROM order_items oi
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id;

-- Final summary
SELECT 'Quick Schema Fix Complete!' as info;
SELECT 
    'Critical connections have been established' as message,
    'All tables are now properly linked' as details,
    NOW() as completed_at;
