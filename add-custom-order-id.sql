-- Add custom_order_id column to orders table for simplified order IDs
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_order_id VARCHAR(20);

-- Add comment to explain the column
COMMENT ON COLUMN orders.custom_order_id IS 'Simplified order ID for display (e.g., ORD123456)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_custom_order_id ON orders(custom_order_id);

-- Add unique constraint to prevent duplicate custom order IDs
ALTER TABLE orders ADD CONSTRAINT unique_custom_order_id UNIQUE (custom_order_id);
