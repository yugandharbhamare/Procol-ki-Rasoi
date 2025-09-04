-- Cleanup Existing Duplicate Orders
-- This script will aggressively remove all duplicate orders from the database

-- ========================================
-- 1. IDENTIFY ALL DUPLICATES FIRST
-- ========================================

-- Show all duplicate orders with details
SELECT 
    'DUPLICATE ORDERS FOUND:' as message,
    user_id,
    order_amount,
    COUNT(*) as duplicate_count,
    array_agg(id) as order_ids,
    array_agg(created_at) as created_times,
    array_agg(custom_order_id) as custom_ids
FROM orders 
GROUP BY user_id, order_amount, DATE(created_at)
HAVING COUNT(*) > 1
ORDER BY user_id, order_amount;

-- ========================================
-- 2. SHOW ORDERS TO BE DELETED
-- ========================================

-- Create a temporary table to identify which orders to keep vs delete
WITH duplicate_orders AS (
    SELECT 
        user_id,
        order_amount,
        DATE(created_at) as order_date,
        id,
        created_at,
        custom_order_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, order_amount, DATE(created_at) 
            ORDER BY created_at ASC
        ) as rn
    FROM orders
),
orders_to_delete AS (
    SELECT id, user_id, order_amount, created_at, custom_order_id
    FROM duplicate_orders 
    WHERE rn > 1
)
SELECT 
    'ORDERS TO BE DELETED:' as message,
    id,
    user_id,
    order_amount,
    created_at,
    custom_order_id
FROM orders_to_delete
ORDER BY user_id, created_at;

-- ========================================
-- 3. DELETE DUPLICATE ORDER ITEMS FIRST
-- ========================================

-- Delete order items for duplicate orders (keep items for the first order)
WITH duplicate_orders AS (
    SELECT 
        user_id,
        order_amount,
        DATE(created_at) as order_date,
        id,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, order_amount, DATE(created_at) 
            ORDER BY created_at ASC
        ) as rn
    FROM orders
),
orders_to_delete AS (
    SELECT id
    FROM duplicate_orders 
    WHERE rn > 1
)
DELETE FROM order_items 
WHERE order_id IN (SELECT id FROM orders_to_delete);

-- ========================================
-- 4. DELETE DUPLICATE ORDERS
-- ========================================

-- Delete duplicate orders (keep the first one created)
WITH duplicate_orders AS (
    SELECT 
        user_id,
        order_amount,
        DATE(created_at) as order_date,
        id,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, order_amount, DATE(created_at) 
            ORDER BY created_at ASC
        ) as rn
    FROM orders
),
orders_to_delete AS (
    SELECT id
    FROM duplicate_orders 
    WHERE rn > 1
)
DELETE FROM orders 
WHERE id IN (SELECT id FROM orders_to_delete);

-- ========================================
-- 5. VERIFY CLEANUP
-- ========================================

-- Check if duplicates still exist
SELECT 
    'VERIFICATION - DUPLICATES REMAINING:' as message,
    user_id,
    order_amount,
    COUNT(*) as order_count
FROM orders 
GROUP BY user_id, order_amount, DATE(created_at)
HAVING COUNT(*) > 1;

-- Show final order count
SELECT 
    'FINAL ORDER COUNT:' as message,
    COUNT(*) as total_orders
FROM orders;

-- Show orders by user
SELECT 
    'ORDERS BY USER:' as message,
    u.name,
    u.emailid,
    COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.emailid
ORDER BY order_count DESC;

-- ========================================
-- 6. ADD CONSTRAINTS TO PREVENT FUTURE DUPLICATES
-- ========================================

-- Add unique constraint to prevent future duplicates
-- Note: We'll use a functional index instead of a constraint with DATE function
DO $$ 
BEGIN
    -- Check if index already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_unique_user_order_per_day'
    ) THEN
        -- Create a unique functional index instead of constraint
        CREATE UNIQUE INDEX idx_unique_user_order_per_day 
        ON orders (user_id, order_amount, DATE(created_at));
        
        RAISE NOTICE 'Added unique index: idx_unique_user_order_per_day';
    ELSE
        RAISE NOTICE 'Index idx_unique_user_order_per_day already exists';
    END IF;
END $$;

-- Add constraint to prevent rapid duplicate submissions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_order_timing' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT unique_user_order_timing 
        UNIQUE (user_id, created_at);
        
        RAISE NOTICE 'Added unique constraint: unique_user_order_timing';
    ELSE
        RAISE NOTICE 'Constraint unique_user_order_timing already exists';
    END IF;
END $$;

-- ========================================
-- 7. FINAL VERIFICATION
-- ========================================

-- Show all constraints on orders table
SELECT 
    'CONSTRAINTS ON ORDERS TABLE:' as message,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'orders'
ORDER BY constraint_name;

-- Show all indexes on orders table
SELECT 
    'INDEXES ON ORDERS TABLE:' as message,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'orders'
ORDER BY indexname;

-- Final duplicate check
SELECT 
    'FINAL DUPLICATE CHECK:' as message,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO DUPLICATES FOUND - CLEANUP SUCCESSFUL!'
        ELSE 'DUPLICATES STILL EXIST - FURTHER INVESTIGATION NEEDED'
    END as status
FROM (
    SELECT user_id, order_amount, DATE(created_at) as order_date
    FROM orders 
    GROUP BY user_id, order_amount, DATE(created_at)
    HAVING COUNT(*) > 1
) duplicates;
