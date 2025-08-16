-- Add user_photo_url column to orders table for displaying user photos in order cards
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_photo_url VARCHAR(500);

-- Add comment to explain the column
COMMENT ON COLUMN orders.user_photo_url IS 'User profile photo URL for display in order cards';

-- Create index for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_orders_user_photo_url ON orders(user_photo_url);
