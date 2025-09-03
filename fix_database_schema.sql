-- Fix Database Schema - Add Missing Connections and Constraints
-- This script connects all tables properly and adds missing relationships
-- Run this in your Supabase SQL editor

-- ========================================
-- STEP 1: Analyze current schema
-- ========================================
SELECT 'Current Schema Analysis' as info;

-- Check current table structures
SELECT 'Tables Status' as info;
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
FROM (VALUES 
    ('users'), 
    ('menu_items'), 
    ('orders'), 
    ('order_items')
) AS t(table_name);

-- Check current foreign key constraints
SELECT 'Current Foreign Keys' as info;
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

-- ========================================
-- STEP 2: Fix users table structure
-- ========================================
SELECT 'Fixing Users Table' as info;

-- Ensure users table has correct structure
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'firebase_uid') THEN
        ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(255);
        RAISE NOTICE 'Added firebase_uid column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'photo_url') THEN
        ALTER TABLE users ADD COLUMN photo_url VARCHAR(500);
        RAISE NOTICE 'Added photo_url column to users table';
    END IF;
    
    -- Make sure required columns are NOT NULL
    ALTER TABLE users ALTER COLUMN name SET NOT NULL;
    ALTER TABLE users ALTER COLUMN emailid SET NOT NULL;
    
    RAISE NOTICE 'Users table structure updated';
END $$;

-- Create missing indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_emailid ON users(emailid);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- ========================================
-- STEP 3: Fix menu_items table structure
-- ========================================
SELECT 'Fixing Menu Items Table' as info;

-- Ensure menu_items table has correct structure
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_available') THEN
        ALTER TABLE menu_items ADD COLUMN is_available BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_available column to menu_items table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'updated_at') THEN
        ALTER TABLE menu_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to menu_items table';
    END IF;
    
    -- Make sure required columns are NOT NULL
    ALTER TABLE menu_items ALTER COLUMN name SET NOT NULL;
    ALTER TABLE menu_items ALTER COLUMN price SET NOT NULL;
    ALTER TABLE menu_items ALTER COLUMN category SET NOT NULL;
    
    RAISE NOTICE 'Menu items table structure updated';
END $$;

-- Create missing indexes for menu_items table
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);

-- ========================================
-- STEP 4: Fix orders table structure
-- ========================================
SELECT 'Fixing Orders Table' as info;

-- Remove denormalized columns (we'll get this data from joins)
DO $$
BEGIN
    -- Remove denormalized columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_name') THEN
        ALTER TABLE orders DROP COLUMN user_name;
        RAISE NOTICE 'Removed denormalized user_name column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_email') THEN
        ALTER TABLE orders DROP COLUMN user_email;
        RAISE NOTICE 'Removed denormalized user_email column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_photo_url') THEN
        ALTER TABLE orders DROP COLUMN user_photo_url;
        RAISE NOTICE 'Removed denormalized user_photo_url column';
    END IF;
    
    RAISE NOTICE 'Orders table denormalized columns removed';
END $$;

-- Ensure orders table has correct structure
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'custom_order_id') THEN
        ALTER TABLE orders ADD COLUMN custom_order_id VARCHAR(20) UNIQUE;
        RAISE NOTICE 'Added custom_order_id column to orders table';
    END IF;
    
    -- Make sure required columns are NOT NULL
    ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
    ALTER TABLE orders ALTER COLUMN order_amount SET NOT NULL;
    
    RAISE NOTICE 'Orders table structure updated';
END $$;

-- Create missing indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_custom_id ON orders(custom_order_id);

-- ========================================
-- STEP 5: Fix order_items table structure
-- ========================================
SELECT 'Fixing Order Items Table' as info;

-- Remove denormalized columns
DO $$
BEGIN
    -- Remove denormalized columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'ordered_by') THEN
        ALTER TABLE order_items DROP COLUMN ordered_by;
        RAISE NOTICE 'Removed denormalized ordered_by column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'order_status') THEN
        ALTER TABLE order_items DROP COLUMN order_status;
        RAISE NOTICE 'Removed denormalized order_status column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'custom_order_id') THEN
        ALTER TABLE order_items DROP COLUMN custom_order_id;
        RAISE NOTICE 'Removed denormalized custom_order_id column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'item_amount') THEN
        ALTER TABLE order_items DROP COLUMN item_amount;
        RAISE NOTICE 'Removed denormalized item_amount column';
    END IF;
    
    RAISE NOTICE 'Order items table denormalized columns removed';
END $$;

-- Add menu_item_id column for proper foreign key relationship
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'menu_item_id') THEN
        ALTER TABLE order_items ADD COLUMN menu_item_id INTEGER;
        RAISE NOTICE 'Added menu_item_id column to order_items table';
    END IF;
    
    -- Make sure required columns are NOT NULL
    ALTER TABLE order_items ALTER COLUMN order_id SET NOT NULL;
    ALTER TABLE order_items ALTER COLUMN item_name SET NOT NULL;
    ALTER TABLE order_items ALTER COLUMN quantity SET NOT NULL;
    ALTER TABLE order_items ALTER COLUMN price SET NOT NULL;
    
    RAISE NOTICE 'Order items table structure updated';
END $$;

-- Create missing indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_name ON order_items(item_name);

-- ========================================
-- STEP 6: Add missing foreign key constraints
-- ========================================
SELECT 'Adding Foreign Key Constraints' as info;

-- Add foreign key from orders to users
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
        RAISE NOTICE 'Added foreign key constraint: orders.user_id -> users.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint orders.user_id -> users.id already exists';
    END IF;
END $$;

-- Add foreign key from order_items to orders
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
        RAISE NOTICE 'Added foreign key constraint: order_items.order_id -> orders.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint order_items.order_id -> orders.id already exists';
    END IF;
END $$;

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
        RAISE NOTICE 'Added foreign key constraint: order_items.menu_item_id -> menu_items.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint order_items.menu_item_id -> menu_items.id already exists';
    END IF;
END $$;

-- ========================================
-- STEP 7: Populate menu_item_id in order_items
-- ========================================
SELECT 'Populating Menu Item References' as info;

-- Update order_items to link with menu_items by name
UPDATE order_items 
SET menu_item_id = mi.id
FROM menu_items mi
WHERE order_items.item_name = mi.name
  AND order_items.menu_item_id IS NULL;

-- Show how many items were linked
SELECT 'Menu Item Linking Results' as info;
SELECT 
    COUNT(*) as total_order_items,
    COUNT(menu_item_id) as linked_items,
    COUNT(*) - COUNT(menu_item_id) as unlinked_items
FROM order_items;

-- ========================================
-- STEP 8: Add triggers for automatic updates
-- ========================================
SELECT 'Adding Triggers' as info;

-- Trigger to update order_amount when order_items change
CREATE OR REPLACE FUNCTION update_order_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE orders 
        SET order_amount = COALESCE(
            (SELECT SUM(price * quantity) FROM order_items WHERE order_id = OLD.order_id), 
            0
        )
        WHERE id = OLD.order_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE orders 
        SET order_amount = COALESCE(
            (SELECT SUM(price * quantity) FROM order_items WHERE order_id = NEW.order_id), 
            0
        )
        WHERE id = NEW.order_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE orders 
        SET order_amount = COALESCE(
            (SELECT SUM(price * quantity) FROM order_items WHERE order_id = NEW.order_id), 
            0
        )
        WHERE id = NEW.order_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order_items changes
DROP TRIGGER IF EXISTS trigger_update_order_amount ON order_items;
CREATE TRIGGER trigger_update_order_amount
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_amount();

-- Trigger to update menu_items updated_at
CREATE OR REPLACE FUNCTION update_menu_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for menu_items updates
DROP TRIGGER IF EXISTS trigger_update_menu_item_timestamp ON menu_items;
CREATE TRIGGER trigger_update_menu_item_timestamp
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_menu_item_timestamp();

-- ========================================
-- STEP 9: Add check constraints for data validation
-- ========================================
SELECT 'Adding Data Validation Constraints' as info;

-- Add check constraints for orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'orders_status_check'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled'));
        RAISE NOTICE 'Added status check constraint for orders';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'orders_amount_check'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_amount_check 
        CHECK (order_amount >= 0);
        RAISE NOTICE 'Added amount check constraint for orders';
    END IF;
END $$;

-- Add check constraints for order_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'order_items_quantity_check'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_quantity_check 
        CHECK (quantity > 0);
        RAISE NOTICE 'Added quantity check constraint for order_items';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'order_items_price_check'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_price_check 
        CHECK (price >= 0);
        RAISE NOTICE 'Added price check constraint for order_items';
    END IF;
END $$;

-- Add check constraints for menu_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'menu_items_price_check'
    ) THEN
        ALTER TABLE menu_items 
        ADD CONSTRAINT menu_items_price_check 
        CHECK (price >= 0);
        RAISE NOTICE 'Added price check constraint for menu_items';
    END IF;
END $$;

-- ========================================
-- STEP 10: Final verification
-- ========================================
SELECT 'Final Schema Verification' as info;

-- Check all foreign key constraints
SELECT 'All Foreign Key Constraints' as info;
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

-- Check table relationships
SELECT 'Table Relationships Test' as info;
SELECT 
    'Users -> Orders' as relationship,
    COUNT(DISTINCT u.id) as users_count,
    COUNT(o.id) as orders_count,
    CASE WHEN COUNT(o.id) > 0 THEN '✅ CONNECTED' ELSE '❌ DISCONNECTED' END as status
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
LIMIT 5;

SELECT 'Orders -> Order Items' as relationship,
    COUNT(DISTINCT o.id) as orders_count,
    COUNT(oi.id) as items_count,
    CASE WHEN COUNT(oi.id) > 0 THEN '✅ CONNECTED' ELSE '❌ DISCONNECTED' END as status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id
LIMIT 5;

SELECT 'Order Items -> Menu Items' as relationship,
    COUNT(oi.id) as order_items_count,
    COUNT(oi.menu_item_id) as linked_items_count,
    CASE WHEN COUNT(oi.menu_item_id) > 0 THEN '✅ CONNECTED' ELSE '❌ DISCONNECTED' END as status
FROM order_items oi
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id;

-- Show final summary
SELECT 'Schema Fix Summary' as info;
SELECT 
    'Database schema updated successfully!' as message,
    'All tables are now properly connected with foreign keys' as details,
    NOW() as completed_at;
