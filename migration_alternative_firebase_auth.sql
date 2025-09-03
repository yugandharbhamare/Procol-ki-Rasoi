-- Alternative approach: Use Firebase auth for user creation
-- This avoids needing the service role key

-- 1. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all users" ON users;

-- 3. Create policy for users to insert their own profile during sign-up
-- This allows insertion when firebase_uid matches the authenticated user
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT 
    WITH CHECK (
        firebase_uid IS NOT NULL 
        AND firebase_uid = auth.jwt() ->> 'sub'
    );

-- 4. Create policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT 
    USING (
        firebase_uid = auth.jwt() ->> 'sub' 
        OR emailid = auth.jwt() ->> 'email'
    );

-- 5. Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    USING (
        firebase_uid = auth.jwt() ->> 'sub' 
        OR emailid = auth.jwt() ->> 'email'
    );

-- 6. Create policy for staff to view all users (for order management)
CREATE POLICY "Staff can view all users" ON users
    FOR SELECT 
    USING (true); -- Staff need to see user info for orders

-- 7. Create a function to handle user creation with proper auth
CREATE OR REPLACE FUNCTION create_user_with_auth(
    user_name TEXT,
    user_email TEXT,
    user_firebase_uid TEXT,
    user_photo_url TEXT
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Check if firebase_uid matches authenticated user
    IF auth.jwt() ->> 'sub' != user_firebase_uid THEN
        RETURN json_build_object('success', false, 'error', 'Firebase UID mismatch');
    END IF;
    
    -- Insert the user
    INSERT INTO users (name, emailid, firebase_uid, photo_url)
    VALUES (user_name, user_email, user_firebase_uid, user_photo_url)
    RETURNING id INTO new_user_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true, 
        'user_id', new_user_id,
        'message', 'User created successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_user_with_auth TO authenticated;

-- 9. Verify setup
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
