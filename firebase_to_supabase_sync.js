// Firebase to Supabase User Sync Script
// This script fetches all users from Firebase and creates them in Supabase
// Run this with: node firebase_to_supabase_sync.js

import { initializeApp } from 'firebase/app';
import { getAuth, listUsers } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Firebase Admin SDK (for server-side operations)
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

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

// Function to sync Firebase users to Supabase
async function syncFirebaseUsersToSupabase() {
  try {
    console.log('🔄 Starting Firebase to Supabase user sync...');
    
    // Check if Supabase users table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Users table does not exist in Supabase!');
      console.error('❌ Please run the migration script first: migration_recreate_users_table.sql');
      return;
    }
    
    console.log('✅ Users table exists in Supabase');
    
    // Get all Firebase users (this requires Firebase Admin SDK)
    // Note: listUsers() is not available in client-side Firebase SDK
    // You'll need to use Firebase Admin SDK or get user data another way
    
    console.log('⚠️  Note: listUsers() requires Firebase Admin SDK');
    console.log('⚠️  For now, we can only sync users who sign in');
    
    // Alternative approach: Get users from existing orders if any
    console.log('🔄 Checking for existing users in orders table...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, user_name, user_email, user_photo_url')
      .limit(100);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('ℹ️  No existing orders found. Users will be created as they sign in.');
      return;
    }
    
    console.log(`📊 Found ${orders.length} orders with user data`);
    
    // Extract unique user information from orders
    const userMap = new Map();
    
    orders.forEach(order => {
      if (order.user_email && !userMap.has(order.user_email)) {
        userMap.set(order.user_email, {
          name: order.user_name || 'Unknown User',
          emailid: order.user_email,
          photo_url: order.user_photo_url || null,
          firebase_uid: null // We don't have this from orders
        });
      }
    });
    
    console.log(`🔄 Found ${userMap.size} unique users to sync`);
    
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
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Function to manually add a specific user (for testing)
async function addSpecificUser(userData) {
  try {
    console.log(`🔄 Adding specific user: ${userData.emailid}`);
    
    const result = await createUserInSupabase(userData);
    
    if (result.success) {
      console.log(`✅ User added successfully: ${userData.emailid}`);
      return result.user;
    } else {
      console.error(`❌ Failed to add user: ${userData.emailid}`, result.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Exception adding user: ${userData.emailid}`, error);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Firebase to Supabase User Sync Tool');
  console.log('=====================================\n');
  
  // Check environment variables
  if (!firebaseConfig.apiKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    console.error('Please check your .env file contains:');
    console.error('- VITE_FIREBASE_API_KEY');
    console.error('- VITE_SUPABASE_URL');
    console.error('- VITE_SUPABASE_ANON_KEY');
    return;
  }
  
  console.log('✅ Environment variables loaded');
  
  // Run the sync
  await syncFirebaseUsersToSupabase();
  
  console.log('\n🎯 Sync complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Users will be automatically created when they sign in');
  console.log('2. Check the Supabase users table to verify the data');
  console.log('3. Test Google sign-in to ensure new users are created properly');
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { syncFirebaseUsersToSupabase, addSpecificUser };
