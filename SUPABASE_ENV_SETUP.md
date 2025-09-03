# Supabase Environment Variables Setup

## Required Environment Variables

To fix the Google authentication and RLS issues, you need to add these environment variables:

### 1. Frontend Environment Variables (.env.local)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 2. How to Get Supabase Service Role Key

1. **Go to your Supabase Dashboard**
2. **Navigate to Settings → API**
3. **Copy the "service_role" key** (NOT the anon key)
4. **Add it to your .env.local file**

⚠️ **Important**: The service role key bypasses RLS and should be kept secure. Only use it for user creation during sign-up.

### 3. Why This Fixes the Issue

- **RLS Enabled**: Users table now has proper security policies
- **Service Role Key**: Allows user creation during sign-up while maintaining security
- **Authenticated Access**: Users can only access their own data
- **Staff Access**: Staff can view user info for order management

### 4. Security Benefits

✅ **Users can only see their own profile**  
✅ **Users can only update their own profile**  
✅ **Staff can view all users for order management**  
✅ **Unauthenticated users cannot access user data**  
✅ **Google auth will work properly**  

### 5. Testing the Fix

1. **Add the environment variables**
2. **Run the RLS migration script**
3. **Restart your application**
4. **Try Google sign-in again**

The authentication should now work properly with secure RLS policies!
