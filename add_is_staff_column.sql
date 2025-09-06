-- Add is_staff column to users table
-- This migration adds a boolean column to track which users are staff members

-- Add the is_staff column with default value false
ALTER TABLE users 
ADD COLUMN is_staff BOOLEAN DEFAULT false;

-- Create an index on is_staff for better query performance
CREATE INDEX idx_users_is_staff ON users(is_staff);

-- Update existing users to set is_staff = true for admin emails
-- Note: This assumes the admin emails are already in the users table
UPDATE users 
SET is_staff = true 
WHERE emailid IN (
  'yugandhar.bhamare@gmail.com'
  -- Add more admin emails here as needed
);

-- Add a comment to document the column
COMMENT ON COLUMN users.is_staff IS 'Indicates if the user has staff portal access';
