-- Add Duplicate Prevention Constraints
-- Run this AFTER running the cleanup script

-- ========================================
-- 1. ADD UNIQUE CONSTRAINT FOR TIMING (IMMEDIATE DUPLICATE PREVENTION)
-- ========================================

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
-- 2. ADD ADDITIONAL SAFEGUARDS
-- ========================================

-- Add check constraint to ensure order_amount is positive
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_positive_amount' 
        AND conrelid = 'orders'::regclass
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT check_positive_amount 
        CHECK (order_amount > 0);
        
        RAISE NOTICE 'Added check constraint: check_positive_amount';
    ELSE
        RAISE NOTICE 'Constraint check_positive_amount already exists';
    END IF;
END $$;

-- Add check constraint to ensure created_at is not in the future
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_valid_created_at' 
        AND conrelid = 'orders'::regclass
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT check_valid_created_at 
        CHECK (created_at <= NOW());
        
        RAISE NOTICE 'Added check constraint: check_valid_created_at';
    ELSE
        RAISE NOTICE 'Constraint check_valid_created_at already exists';
    END IF;
END $$;

-- ========================================
-- 3. CREATE A TRIGGER FOR DUPLICATE PREVENTION
-- ========================================

-- Create a function to check for duplicate orders
CREATE OR REPLACE FUNCTION check_duplicate_orders()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's already an order with same user_id, order_amount on the same day
    IF EXISTS (
        SELECT 1 FROM orders 
        WHERE user_id = NEW.user_id 
        AND order_amount = NEW.order_amount 
        AND DATE(created_at) = DATE(NEW.created_at)
        AND id != NEW.id  -- Exclude the current order being inserted/updated
    ) THEN
        RAISE EXCEPTION 'Duplicate order detected: User % already has an order with amount % on %', 
            NEW.user_id, NEW.order_amount, DATE(NEW.created_at);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'check_duplicate_orders_trigger'
    ) THEN
        CREATE TRIGGER check_duplicate_orders_trigger
        BEFORE INSERT OR UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION check_duplicate_orders();
        
        RAISE NOTICE 'Added trigger: check_duplicate_orders_trigger';
    ELSE
        RAISE NOTICE 'Trigger check_duplicate_orders_trigger already exists';
    END IF;
END $$;

-- ========================================
-- 4. VERIFY CONSTRAINTS AND TRIGGERS
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

-- Show all triggers on orders table
SELECT 
    'TRIGGERS ON ORDERS TABLE:' as message,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'orders'::regclass;

-- Show all indexes on orders table
SELECT 
    'INDEXES ON ORDERS TABLE:' as message,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'orders'
ORDER BY indexname;

-- ========================================
-- 5. TEST CONSTRAINT EFFECTIVENESS
-- ========================================

-- Try to insert a duplicate order to test the trigger
-- This should fail if the trigger is working
DO $$ 
DECLARE
    test_user_id UUID;
    test_amount DECIMAL(10,2);
BEGIN
    -- Get a sample user and amount for testing
    SELECT user_id, order_amount INTO test_user_id, test_amount
    FROM orders 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        BEGIN
            -- Try to insert a duplicate (should fail due to trigger)
            INSERT INTO orders (user_id, order_amount, status) 
            VALUES (test_user_id, test_amount, 'pending');
            
            RAISE NOTICE 'WARNING: Duplicate prevention not working - duplicate order was inserted!';
        EXCEPTION 
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Duplicate order detected%' THEN
                    RAISE NOTICE 'SUCCESS: Duplicate prevention trigger is working - duplicate order was rejected';
                ELSE
                    RAISE NOTICE 'INFO: Other error occurred: %', SQLERRM;
                END IF;
        END;
    ELSE
        RAISE NOTICE 'INFO: No orders found to test constraints';
    END IF;
END $$;

-- ========================================
-- 6. SHOW FINAL PROTECTION STATUS
-- ========================================

SELECT 
    'DUPLICATE PREVENTION STATUS:' as message,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'orders' AND constraint_name = 'unique_user_order_timing'
        ) THEN '✅ Timing constraint active'
        ELSE '❌ Timing constraint missing'
    END as timing_protection,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'check_duplicate_orders_trigger'
        ) THEN '✅ Duplicate check trigger active'
        ELSE '❌ Duplicate check trigger missing'
    END as duplicate_protection,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'check_positive_amount' 
            AND conrelid = 'orders'::regclass
        ) THEN '✅ Amount validation active'
        ELSE '❌ Amount validation missing'
    END as amount_protection;
