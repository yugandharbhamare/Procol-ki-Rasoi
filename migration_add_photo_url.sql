-- Migration script to add photo_url column to users table
-- This allows storing Google profile photos

-- 1. Add photo_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- 2. Add comment to the column
COMMENT ON COLUMN users.photo_url IS 'Google profile photo URL';

-- 3. Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'photo_url';

-- 4. Show current users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
