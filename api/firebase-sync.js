// Firebase to Supabase User Sync - Server Side
// This script can be run from your backend API to sync users

const { initializeApp } = require('firebase/app');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
};

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to create user in Supabase
async function createUserInSupabase(userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert([userData], { onConflict: 'emailid' })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating user ${userData.emailid}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ User created/updated in Supabase: ${userData.emailid}`);
    return { success: true, user: data };
  } catch (error) {
    console.error(`❌ Exception creating user ${userData.emailid}:`, error);
    return { success: false, error: error.message };
  }
}

// Function to sync users from existing orders
async function syncUsersFromOrders() {
  try {
    console.log('🔄 Starting user sync from existing orders...');
    
    // Check if users table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Users table does not exist in Supabase!');
      console.error('❌ Please run the migration script first');
      return { success: false, error: 'Users table does not exist' };
    }
    
    console.log('✅ Users table exists in Supabase');
    
    // Get all orders to extract user information
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1000);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return { success: false, error: ordersError.message };
    }
    
    if (!orders || orders.length === 0) {
      console.log('ℹ️  No existing orders found');
      return { success: true, message: 'No orders to sync', count: 0 };
    }
    
    console.log(`📊 Found ${orders.length} orders`);
    
    // Extract unique user information from orders
    const userMap = new Map();
    
    orders.forEach(order => {
      // Try to get user info from different possible sources
      let userEmail = null;
      let userName = null;
      let userPhoto = null;
      
      // Check if order has user_id that references users table
      if (order.user_id) {
        // This order has a user_id, we'll need to check if user exists
        // For now, we'll skip these as they should already have users
        return;
      }
      
      // Check for embedded user data (if any)
      if (order.user_email) {
        userEmail = order.user_email;
        userName = order.user_name || 'Unknown User';
        userPhoto = order.user_photo_url || null;
      }
      
      if (userEmail && !userMap.has(userEmail)) {
        userMap.set(userEmail, {
          name: userName,
          emailid: userEmail,
          photo_url: userPhoto,
          firebase_uid: null // We don't have this from orders
        });
      }
    });
    
    console.log(`🔄 Found ${userMap.size} unique users to sync`);
    
    if (userMap.size === 0) {
      console.log('ℹ️  No users to sync from orders');
      return { success: true, message: 'No users to sync', count: 0 };
    }
    
    // Create users in Supabase
    let successCount = 0;
    let errorCount = 0;
    
    for (const [email, userData] of userMap) {
      const result = await createUserInSupabase(userData);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Sync Summary:');
    console.log(`✅ Successfully synced: ${successCount} users`);
    console.log(`❌ Failed to sync: ${errorCount} users`);
    console.log(`📈 Total users processed: ${userMap.size}`);
    
    return {
      success: true,
      message: 'Sync completed',
      total: userMap.size,
      successCount,
      errorCount
    };
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { success: false, error: error.message };
  }
}

// Function to manually add a test user
async function addTestUser() {
  const testUser = {
    name: 'Test User',
    emailid: 'test@example.com',
    photo_url: 'https://example.com/photo.jpg',
    firebase_uid: 'test-uid-123'
  };
  
  return await createUserInSupabase(testUser);
}

// Function to get current user count
async function getUserCount() {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error getting user count:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('❌ Exception getting user count:', error);
    return { success: false, error: error.message };
  }
}

// Export functions for use in API routes
module.exports = {
  syncUsersFromOrders,
  addTestUser,
  getUserCount,
  createUserInSupabase
};

// If running directly, execute the sync
if (require.main === module) {
  console.log('🚀 Firebase to Supabase User Sync Tool');
  console.log('=====================================\n');
  
  // Check environment variables
  if (!firebaseConfig.apiKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
  }
  
  // Run the sync
  syncUsersFromOrders()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Sync completed successfully!');
        console.log(`📊 Total users: ${result.count}`);
      } else {
        console.error('\n❌ Sync failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Sync failed with exception:', error);
      process.exit(1);
    });
}
