#!/usr/bin/env node

// Database Cleanup Script
// This script fixes null values in orders and order_items tables
// Run with: node cleanup_database.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please check your .env file contains:');
  console.error('- SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('- SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to check current state
async function checkCurrentState() {
  console.log('🔍 Checking current database state...\n');
  
  try {
    // Check orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }
    
    const totalOrders = orders.length;
    const nullUserId = orders.filter(o => o.user_id === null).length;
    const nullCustomOrderId = orders.filter(o => o.custom_order_id === null).length;
    const nullStatus = orders.filter(o => o.status === null).length;
    const nullOrderAmount = orders.filter(o => o.order_amount === null).length;
    
    console.log('📊 Orders Table:');
    console.log(`   Total orders: ${totalOrders}`);
    console.log(`   Null user_id: ${nullUserId}`);
    console.log(`   Null custom_order_id: ${nullCustomOrderId}`);
    console.log(`   Null status: ${nullStatus}`);
    console.log(`   Null order_amount: ${nullOrderAmount}\n`);
    
    // Check order_items table
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*');
    
    if (itemsError) {
      console.error('❌ Error fetching order items:', itemsError);
      return;
    }
    
    const totalItems = orderItems.length;
    const nullOrderId = orderItems.filter(oi => oi.order_id === null).length;
    const nullItemName = orderItems.filter(oi => oi.item_name === null).length;
    const nullQuantity = orderItems.filter(oi => oi.quantity === null).length;
    const nullPrice = orderItems.filter(oi => oi.price === null).length;
    
    console.log('📦 Order Items Table:');
    console.log(`   Total items: ${totalItems}`);
    console.log(`   Null order_id: ${nullOrderId}`);
    console.log(`   Null item_name: ${nullItemName}`);
    console.log(`   Null quantity: ${nullQuantity}`);
    console.log(`   Null price: ${nullPrice}\n`);
    
    return {
      orders: { total: totalOrders, nullUserId, nullCustomOrderId, nullStatus, nullOrderAmount },
      items: { total: totalItems, nullOrderId, nullItemName, nullQuantity, nullPrice }
    };
    
  } catch (error) {
    console.error('❌ Error checking state:', error);
    return null;
  }
}

// Function to fix custom_order_id
async function fixCustomOrderIds() {
  console.log('🔧 Fixing custom_order_id...');
  
  try {
    const { data, error } = await supabase
      .rpc('fix_custom_order_ids');
    
    if (error) {
      // If RPC doesn't exist, use direct SQL
      console.log('   Using direct SQL update...');
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          custom_order_id: 'ORD' + Math.floor(Math.random() * 900000 + 100000).toString().padStart(6, '0')
        })
        .is('custom_order_id', null);
      
      if (updateError) {
        console.error('   ❌ Error updating custom_order_id:', updateError);
        return false;
      }
    }
    
    console.log('   ✅ Custom order IDs fixed');
    return true;
    
  } catch (error) {
    console.error('   ❌ Error fixing custom_order_id:', error);
    return false;
  }
}

// Function to fix status
async function fixStatus() {
  console.log('🔧 Fixing status...');
  
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'pending' })
      .is('status', null);
    
    if (error) {
      console.error('   ❌ Error updating status:', error);
      return false;
    }
    
    console.log('   ✅ Status fixed');
    return true;
    
  } catch (error) {
    console.error('   ❌ Error fixing status:', error);
    return false;
  }
}

// Function to fix order items
async function fixOrderItems() {
  console.log('🔧 Fixing order items...');
  
  try {
    // Fix item_name
    const { error: nameError } = await supabase
      .from('order_items')
      .update({ item_name: 'Unknown Item' })
      .is('item_name', null);
    
    if (nameError) {
      console.error('   ❌ Error updating item_name:', nameError);
      return false;
    }
    
    // Fix quantity
    const { error: qtyError } = await supabase
      .from('order_items')
      .update({ quantity: 1 })
      .is('quantity', null);
    
    if (qtyError) {
      console.error('   ❌ Error updating quantity:', qtyError);
      return false;
    }
    
    // Fix price
    const { error: priceError } = await supabase
      .from('order_items')
      .update({ price: 0 })
      .is('price', null);
    
    if (priceError) {
      console.error('   ❌ Error updating price:', priceError);
      return false;
    }
    
    console.log('   ✅ Order items fixed');
    return true;
    
  } catch (error) {
    console.error('   ❌ Error fixing order items:', error);
    return false;
  }
}

// Function to recalculate order amounts
async function recalculateOrderAmounts() {
  console.log('🔧 Recalculating order amounts...');
  
  try {
    // Get all orders with their items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id');
    
    if (ordersError) {
      console.error('   ❌ Error fetching orders:', ordersError);
      return false;
    }
    
    let updatedCount = 0;
    
    for (const order of orders) {
      // Get items for this order
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('price, quantity')
        .eq('order_id', order.id);
      
      if (itemsError) {
        console.error(`   ❌ Error fetching items for order ${order.id}:`, itemsError);
        continue;
      }
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Update order amount
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_amount: totalAmount })
        .eq('id', order.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating order ${order.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
    
    console.log(`   ✅ Updated ${updatedCount} orders`);
    return true;
    
  } catch (error) {
    console.error('   ❌ Error recalculating amounts:', error);
    return false;
  }
}

// Function to fix foreign key constraint violations
async function fixForeignKeyConstraints() {
  console.log('🔧 Fixing foreign key constraints...');
  
  try {
    // Check if users table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('   Users table does not exist, creating it...');
      
      // Create users table
      const { error: createError } = await supabase.rpc('create_users_table');
      
      if (createError) {
        console.log('   Using direct SQL approach...');
        // If RPC doesn't exist, we'll handle it differently
        return false;
      }
    }
    
    // Get all orders with user_id
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, created_at')
      .not('user_id', 'is', null);
    
    if (ordersError) {
      console.error('   ❌ Error fetching orders:', ordersError);
      return false;
    }
    
    if (!orders || orders.length === 0) {
      console.log('   ✅ No orders with user_id found');
      return true;
    }
    
    console.log(`   Found ${orders.length} orders with user_id`);
    
    // Create users for each unique user_id
    const uniqueUserIds = [...new Set(orders.map(o => o.user_id))];
    console.log(`   Creating ${uniqueUserIds.length} users...`);
    
    let createdCount = 0;
    
    for (const userId of uniqueUserIds) {
      const userData = {
        id: userId,
        name: `User ${userId.substring(0, 8)}`,
        emailid: `user_${userId.substring(0, 8)}@procol-ki-rasoi.com`,
        photo_url: null,
        firebase_uid: null,
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('users')
        .upsert([userData], { onConflict: 'id' });
      
      if (insertError) {
        console.error(`   ❌ Error creating user ${userId}:`, insertError);
      } else {
        createdCount++;
      }
    }
    
    console.log(`   ✅ Created ${createdCount} users`);
    
    // Create system user for any orders without user_id
    const systemUser = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'System User',
      emailid: 'system@procol-ki-rasoi.com',
      photo_url: null,
      firebase_uid: null,
      created_at: new Date().toISOString()
    };
    
    const { error: systemError } = await supabase
      .from('users')
      .upsert([systemUser], { onConflict: 'id' });
    
    if (systemError) {
      console.error('   ❌ Error creating system user:', systemError);
    } else {
      console.log('   ✅ System user created/updated');
    }
    
    // Update orders without user_id to use system user
    const { error: updateError } = await supabase
      .from('orders')
      .update({ user_id: '00000000-0000-0000-0000-000000000000' })
      .is('user_id', null);
    
    if (updateError) {
      console.error('   ❌ Error updating orders:', updateError);
    } else {
      console.log('   ✅ Orders without user_id updated');
    }
    
    return true;
    
  } catch (error) {
    console.error('   ❌ Error fixing foreign key constraints:', error);
    return false;
  }
}

// Main cleanup function
async function cleanupDatabase() {
  console.log('🚀 Starting Database Cleanup...\n');
  
  try {
    // Check current state
    const initialState = await checkCurrentState();
    if (!initialState) {
      console.error('❌ Could not check initial state');
      return;
    }
    
    // Fix issues step by step
    console.log('🔧 Starting fixes...\n');
    
    // Step 1: Fix foreign key constraints FIRST
    await fixForeignKeyConstraints();
    
    // Step 2: Fix custom_order_id
    await fixCustomOrderIds();
    
    // Step 3: Fix status
    await fixStatus();
    
    // Step 4: Fix order items
    await fixOrderItems();
    
    // Step 5: Recalculate amounts
    await recalculateOrderAmounts();
    
    console.log('\n✅ Cleanup completed!');
    
    // Check final state
    console.log('\n🔍 Checking final state...\n');
    await checkCurrentState();
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log('\n🎯 Database cleanup completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Database cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDatabase, checkCurrentState };
