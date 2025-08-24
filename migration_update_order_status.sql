-- Migration to update order status check constraint
-- This consolidates 'rejected' into 'cancelled' and removes 'ready' status

-- Drop the existing check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new check constraint with updated status values
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled'));

-- Update any existing 'ready' orders to 'completed' (since we consolidated them)
UPDATE orders SET status = 'completed' WHERE status = 'ready';

-- Update any existing 'rejected' orders to 'cancelled' (since we consolidated them)
UPDATE orders SET status = 'cancelled' WHERE status = 'rejected';
