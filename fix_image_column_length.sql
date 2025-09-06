-- Fix image column length to support base64 data URLs
-- Base64 encoded images can be much longer than 500 characters

-- Update the image column to support longer URLs (including base64 data URLs)
ALTER TABLE menu_items 
ALTER COLUMN image TYPE TEXT;

-- Also update the users table photo_url column for consistency
ALTER TABLE users 
ALTER COLUMN photo_url TYPE TEXT;

-- Add a comment to document the change
COMMENT ON COLUMN menu_items.image IS 'Image URL or base64 data URL for the menu item';
COMMENT ON COLUMN users.photo_url IS 'User profile photo URL or base64 data URL';
