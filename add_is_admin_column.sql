-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- Update existing admin user
UPDATE users SET is_admin = true WHERE emailid = 'yugandhar.bhamare@gmail.com';

-- Add comment for documentation
COMMENT ON COLUMN users.is_admin IS 'Indicates if user has admin privileges';
