-- Protect Last Admin Trigger
-- This trigger prevents removing admin privileges from the last admin user

-- Function to check if we're trying to remove the last admin
CREATE OR REPLACE FUNCTION protect_last_admin()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- Only check if we're updating is_admin from true to false
    IF OLD.is_admin = true AND NEW.is_admin = false THEN
        -- Count total admins (including hardcoded admin)
        SELECT COUNT(*) INTO admin_count
        FROM users 
        WHERE is_admin = true 
           OR emailid = 'yugandhar.bhamare@gmail.com';
        
        -- If this would leave us with no admins, prevent the update
        IF admin_count <= 1 THEN
            RAISE EXCEPTION 'Cannot remove admin privileges from the last admin user. At least one admin must remain in the system.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS protect_last_admin_trigger ON users;
CREATE TRIGGER protect_last_admin_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION protect_last_admin();

-- Add comment for documentation
COMMENT ON FUNCTION protect_last_admin() IS 'Prevents removing admin privileges from the last admin user';
COMMENT ON TRIGGER protect_last_admin_trigger ON users IS 'Protects against removing the last admin user from the system';
