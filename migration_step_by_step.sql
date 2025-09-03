-- Step-by-step migration script for adding custom order IDs
-- Run each section separately to avoid errors

-- ========================================
-- STEP 1: Add the custom_order_id column
-- ========================================
-- Run this first:
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_order_id VARCHAR(20);

-- ========================================
-- STEP 2: Create the unique index
-- ========================================
-- Run this after step 1:
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_custom_order_id ON orders(custom_order_id);

-- ========================================
-- STEP 3: Create the function
-- ========================================
-- Run this after step 2:
CREATE OR REPLACE FUNCTION generate_custom_order_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate ORD + 6 random digits
    NEW.custom_order_id := 'ORD' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Ensure uniqueness (retry if duplicate)
    WHILE EXISTS (SELECT 1 FROM orders WHERE custom_order_id = NEW.custom_order_id) LOOP
        NEW.custom_order_id := 'ORD' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 4: Create the trigger
-- ========================================
-- Run this after step 3:
DROP TRIGGER IF EXISTS generate_custom_order_id_trigger ON orders;

CREATE TRIGGER generate_custom_order_id_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_custom_order_id();

-- ========================================
-- STEP 5: Generate IDs for existing orders
-- ========================================
-- Run this after step 4:
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

-- ========================================
-- STEP 6: Make the column NOT NULL
-- ========================================
-- Run this last, after step 5:
ALTER TABLE orders ALTER COLUMN custom_order_id SET NOT NULL;

-- ========================================
-- VERIFICATION: Check the results
-- ========================================
-- Run this to verify everything worked:
SELECT 
    id, 
    custom_order_id, 
    status, 
    order_amount, 
    created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
