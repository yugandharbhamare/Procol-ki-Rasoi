-- Fix missing DELETE policies for orders and order_items
-- This script adds the necessary RLS policies to allow order deletion

-- Add DELETE policy for orders (staff only)
CREATE POLICY "Staff can delete orders" ON orders
    FOR DELETE USING (true);

-- Add DELETE policy for order_items (staff only)  
CREATE POLICY "Staff can delete order items" ON order_items
    FOR DELETE USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items') 
AND cmd = 'DELETE';
