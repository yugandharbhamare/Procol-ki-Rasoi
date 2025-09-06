-- Add notes column to orders table for chef instructions
-- This allows customers to add special instructions for their orders

-- Add the notes column to the orders table
ALTER TABLE orders 
ADD COLUMN notes TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN orders.notes IS 'Special instructions or notes from the customer for the chef';

-- Create an index for better performance when filtering orders with notes
CREATE INDEX idx_orders_notes ON orders(notes) WHERE notes IS NOT NULL;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'notes';
