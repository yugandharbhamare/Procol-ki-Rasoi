-- Add photo_url column to users table for Google profile photos
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- Add comment to explain the column
COMMENT ON COLUMN users.photo_url IS 'Google profile photo URL for user identification';

-- Create index for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_users_photo_url ON users(photo_url);
