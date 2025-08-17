-- Add new columns to order_items table for enhanced functionality
-- Run this script in your Supabase SQL Editor

-- 1. Add item_amount column (price x quantity)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_amount DECIMAL(10,2);

-- 2. Add ordered_by column (User Name)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS ordered_by VARCHAR(255);

-- 3. Add order_status column (linked to orders table)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS order_status VARCHAR(50);

-- 4. Add custom_order_id column (linked to orders table)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_order_id VARCHAR(20);

-- Add comments to explain the columns
COMMENT ON COLUMN order_items.item_amount IS 'Total amount for this item (price x quantity)';
COMMENT ON COLUMN order_items.ordered_by IS 'Name of the user who placed the order';
COMMENT ON COLUMN order_items.order_status IS 'Status of the order (pending, accepted, ready, completed)';
COMMENT ON COLUMN order_items.custom_order_id IS 'Custom order ID from orders table (e.g., ORD123456)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_item_amount ON order_items(item_amount);
CREATE INDEX IF NOT EXISTS idx_order_items_ordered_by ON order_items(ordered_by);
CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON order_items(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_custom_order_id ON order_items(custom_order_id);

-- Add foreign key constraint for custom_order_id
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_custom_order_id 
  FOREIGN KEY (custom_order_id) REFERENCES orders(custom_order_id) ON DELETE CASCADE;

-- Update existing order items with calculated values
UPDATE order_items 
SET 
  item_amount = price * quantity,
  order_status = orders.status,
  custom_order_id = orders.custom_order_id,
  ordered_by = orders.user_name
FROM orders 
WHERE order_items.order_id = orders.id;

-- Success message
SELECT '✅ Order items columns added successfully!' as status;
