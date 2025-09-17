-- Add image column to order_items table
-- This will allow storing menu item images with order items

-- Add the image column
ALTER TABLE order_items ADD COLUMN image VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN order_items.image IS 'Image path or base64 data for the menu item';

-- Create index for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_order_items_image ON order_items(image) WHERE image IS NOT NULL;
