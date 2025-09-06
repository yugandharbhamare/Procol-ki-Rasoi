-- Comprehensive fix for staff and admin columns
-- This script ensures the users table has the required columns and data

-- Step 1: Add is_staff column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_staff'
    ) THEN
        ALTER TABLE users ADD COLUMN is_staff BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_users_is_staff ON users(is_staff);
        RAISE NOTICE 'Added is_staff column and index';
    ELSE
        RAISE NOTICE 'is_staff column already exists';
    END IF;
END $$;

-- Step 2: Add is_admin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
        RAISE NOTICE 'Added is_admin column and index';
    ELSE
        RAISE NOTICE 'is_admin column already exists';
    END IF;
END $$;

-- Step 3: Update yugandhar.bhamare@gmail.com to be both admin and staff
UPDATE users 
SET 
    is_admin = true,
    is_staff = true
WHERE emailid = 'yugandhar.bhamare@gmail.com';

-- Step 4: Verify the update
SELECT 
    emailid,
    name,
    is_admin,
    is_staff,
    created_at
FROM users 
WHERE emailid = 'yugandhar.bhamare@gmail.com';

-- Step 5: Show all users with their roles
SELECT 
    emailid,
    name,
    is_admin,
    is_staff,
    CASE 
        WHEN is_admin = true THEN 'Admin'
        WHEN is_staff = true THEN 'Staff'
        ELSE 'Regular User'
    END as role
FROM users 
ORDER BY is_admin DESC, is_staff DESC, created_at DESC;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN users.is_staff IS 'Indicates if the user has staff portal access';
COMMENT ON COLUMN users.is_admin IS 'Indicates if user has admin privileges';
