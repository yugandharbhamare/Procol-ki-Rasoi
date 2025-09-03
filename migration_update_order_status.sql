-- Migration script to update existing orders with missing columns and custom order IDs

-- 1. Add custom_order_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_order_id VARCHAR(20);

-- 2. Create unique index on custom_order_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_custom_order_id ON orders(custom_order_id);

-- 3. Generate custom order IDs for existing orders that don't have them
DO $$
DECLARE
    order_record RECORD;
    new_custom_id VARCHAR(20);
    counter INTEGER := 1;
BEGIN
    FOR order_record IN SELECT id FROM orders WHERE custom_order_id IS NULL LOOP
        -- Generate unique custom order ID
        LOOP
            new_custom_id := 'ORD' || LPAD(counter::TEXT, 6, '0');
            counter := counter + 1;
            
            -- Check if this ID already exists
            EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE custom_order_id = new_custom_id);
        END LOOP;
        
        -- Update the order with the new custom ID
        UPDATE orders SET custom_order_id = new_custom_id WHERE id = order_record.id;
    END LOOP;
END $$;

-- 4. Make custom_order_id NOT NULL after populating existing records
ALTER TABLE orders ALTER COLUMN custom_order_id SET NOT NULL;

-- 5. Update existing orders to use the new structure
-- This will be handled by the application code when it fetches orders
