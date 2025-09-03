#!/usr/bin/env node

// Simple script to run the Firebase to Supabase user sync
// Run with: node run_sync.js

const { syncUsersFromOrders, getUserCount } = require('./api/firebase-sync.js');

async function main() {
  console.log('🚀 Firebase to Supabase User Sync Tool');
  console.log('=====================================\n');
  
  try {
    // First check current user count
    console.log('📊 Checking current user count...');
    const countResult = await getUserCount();
    
    if (countResult.success) {
      console.log(`✅ Current users in Supabase: ${countResult.count}`);
    } else {
      console.log('⚠️  Could not get user count:', countResult.error);
    }
    
    console.log('\n🔄 Starting user sync...');
    
    // Run the sync
    const result = await syncUsersFromOrders();
    
    if (result.success) {
      console.log('\n🎯 Sync completed successfully!');
      console.log(`📊 Total users processed: ${result.total}`);
      console.log(`✅ Successfully synced: ${result.successCount} users`);
      console.log(`❌ Failed to sync: ${result.errorCount} users`);
      
      // Check final user count
      const finalCountResult = await getUserCount();
      if (finalCountResult.success) {
        console.log(`📈 Final user count: ${finalCountResult.count}`);
      }
    } else {
      console.error('\n❌ Sync failed:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Sync failed with exception:', error);
    process.exit(1);
  }
}

// Run the script
main();
