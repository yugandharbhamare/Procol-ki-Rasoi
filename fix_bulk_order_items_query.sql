-- Fix for Bulk Order Items Query - URL Length Limit Issue
-- This creates an RPC function to handle large lists of order IDs without URL length limits

-- Create a function to get order items by a large array of order IDs
CREATE OR REPLACE FUNCTION get_order_items_by_ids(order_ids UUID[])
RETURNS TABLE (
    id UUID,
    order_id UUID,
    item_name VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return order items where order_id is in the provided array
    RETURN QUERY
    SELECT 
        oi.id,
        oi.order_id,
        oi.item_name,
        oi.quantity,
        oi.price,
        oi.created_at
    FROM order_items oi
    WHERE oi.order_id = ANY(order_ids)
    ORDER BY oi.order_id, oi.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_order_items_by_ids(UUID[]) TO authenticated;

-- Grant execute permission to anon users (if needed for your setup)
GRANT EXECUTE ON FUNCTION get_order_items_by_ids(UUID[]) TO anon;

-- Add a comment to document the function
COMMENT ON FUNCTION get_order_items_by_ids(UUID[]) IS 'Get order items for multiple order IDs without URL length limits. Accepts array of UUIDs and returns matching order items.';

-- Test the function (optional - remove this in production)
-- SELECT * FROM get_order_items_by_ids(ARRAY['your-order-id-1', 'your-order-id-2']);
