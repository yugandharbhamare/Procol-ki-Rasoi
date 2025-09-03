-- Fix Foreign Key Constraint Violations
-- This script resolves the "orders_user_id_fkey" constraint error
-- Run this in your Supabase SQL editor

-- ========================================
-- STEP 1: Check the current state
-- ========================================
SELECT 'Current State Analysis' as info;

-- Check how many orders have user_id that don't exist in users table
SELECT 'Orphaned Orders Count' as info;
SELECT COUNT(*) as orphaned_orders
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL AND o.user_id IS NOT NULL;

-- Show sample orphaned orders
SELECT 'Sample Orphaned Orders' as info;
SELECT 
    o.id,
    o.user_id,
    o.custom_order_id,
    o.status,
    o.order_amount,
    o.created_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL AND o.user_id IS NOT NULL
LIMIT 5;

-- Check if users table exists and has data
SELECT 'Users Table Status' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as users_table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN (SELECT COUNT(*) FROM users)::TEXT
        ELSE 'N/A'
    END as users_count;

-- ========================================
-- STEP 2: Create users table if missing
-- ========================================
-- Only run this if users table doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            emailid VARCHAR(255) UNIQUE NOT NULL,
            photo_url VARCHAR(500),
            firebase_uid VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_users_emailid ON users(emailid);
        CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
        
        -- Enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid()::TEXT = firebase_uid);
            
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid()::TEXT = firebase_uid);
            
        CREATE POLICY "Users can insert own profile" ON users
            FOR INSERT WITH CHECK (auth.uid()::TEXT = firebase_uid);
            
        CREATE POLICY "Staff can view all users" ON users
            FOR SELECT USING (auth.role() = 'staff');
            
        RAISE NOTICE 'Users table created successfully';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END $$;

-- ========================================
-- STEP 3: Create missing users from orders
-- ========================================
-- Insert users for orders that have user_id but no corresponding user
INSERT INTO users (id, name, emailid, photo_url, firebase_uid, created_at)
SELECT DISTINCT
    o.user_id,
    COALESCE(o.user_name, 'Unknown User') as name,
    COALESCE(o.user_email, 'user_' || o.user_id::TEXT || '@unknown.com') as emailid,
    o.user_photo_url as photo_url,
    NULL as firebase_uid,
    COALESCE(o.created_at, NOW()) as created_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL 
  AND o.user_id IS NOT NULL
  AND o.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STEP 4: Handle orders without user_id
-- ========================================
-- For orders that don't have user_id, we need to either:
-- Option A: Create a default user and assign it
-- Option B: Remove the foreign key constraint temporarily

-- Option A: Create a default user for orphaned orders
INSERT INTO users (id, name, emailid, photo_url, firebase_uid, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'System User',
    'system@procol-ki-rasoi.com',
    NULL,
    NULL,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update orders without user_id to use the system user
UPDATE orders 
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

-- ========================================
-- STEP 5: Verify foreign key constraints
-- ========================================
SELECT 'Verifying Foreign Key Constraints' as info;

-- Check if there are still any orphaned orders
SELECT 'Remaining Orphaned Orders' as info;
SELECT COUNT(*) as remaining_orphaned
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- Check orders table structure
SELECT 'Orders Table Structure' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- ========================================
-- STEP 6: Recreate foreign key constraint if needed
-- ========================================
-- If the constraint was dropped, recreate it
DO $$
BEGIN
    -- Check if constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_fkey' 
        AND table_name = 'orders'
    ) THEN
        -- Recreate the constraint
        ALTER TABLE orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint recreated';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- ========================================
-- STEP 7: Final verification
-- ========================================
SELECT 'Final Verification' as info;

-- Check final state
SELECT 'Final Orders State' as info;
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id,
    COUNT(CASE WHEN custom_order_id IS NULL THEN 1 END) as null_custom_order_id,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
    COUNT(CASE WHEN order_amount IS NULL THEN 1 END) as null_order_amount
FROM orders;

SELECT 'Final Users State' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as null_name,
    COUNT(CASE WHEN emailid IS NULL THEN 1 END) as null_email
FROM users;

-- Test foreign key constraint
SELECT 'Foreign Key Test' as info;
SELECT 
    o.id,
    o.custom_order_id,
    u.name as user_name,
    u.emailid as user_email
FROM orders o
JOIN users u ON o.user_id = u.id
LIMIT 5;

-- Show summary
SELECT 'Summary' as info;
SELECT 
    'Foreign key constraints fixed successfully!' as message,
    NOW() as completed_at;
