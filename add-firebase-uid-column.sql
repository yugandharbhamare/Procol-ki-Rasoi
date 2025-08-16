-- Add firebase_uid column to users table for Firebase auth integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255);

-- Create index for firebase_uid for better performance
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Add unique constraint to prevent duplicate Firebase UIDs
ALTER TABLE users ADD CONSTRAINT unique_firebase_uid UNIQUE (firebase_uid);
