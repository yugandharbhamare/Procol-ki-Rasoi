-- Add user and email columns to orders table
-- This will store the user information directly in the orders table for easier querying

-- Add user_name column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);

-- Add user_email column  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

-- Add comments to explain the columns
COMMENT ON COLUMN orders.user_name IS 'Name of the user who created this order';
COMMENT ON COLUMN orders.user_email IS 'Email of the user who created this order';

-- Create indexes for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_name ON orders(user_name);

-- Update existing orders with user information if possible
-- This will populate user_name and user_email from the users table based on user_id
UPDATE orders 
SET 
  user_name = users.name,
  user_email = users.emailid
FROM users 
WHERE orders.user_id = users.id 
  AND orders.user_name IS NULL 
  AND orders.user_email IS NULL;
