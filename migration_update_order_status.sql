-- Migration to update order status check constraint
-- This adds 'rejected' status and removes 'ready' status

-- Drop the existing check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new check constraint with updated status values
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'accepted', 'completed', 'rejected', 'cancelled'));

-- Update any existing 'ready' orders to 'completed' (since we consolidated them)
UPDATE orders SET status = 'completed' WHERE status = 'ready';
