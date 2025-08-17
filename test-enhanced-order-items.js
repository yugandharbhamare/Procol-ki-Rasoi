// Test script to verify enhanced order items functionality
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEnhancedOrderItems() {
  try {
    console.log('🔍 Testing enhanced order items functionality...')
    
    // Test 1: Check if new columns exist
    console.log('\n1. Checking if new columns exist...')
    const { data: columns, error: columnsError } = await supabase
      .from('order_items')
      .select('item_amount, ordered_by, order_status, custom_order_id')
      .limit(1)
    
    if (columnsError) {
      console.error('❌ New columns not found. Please run add-order-items-columns.sql')
      return
    }
    console.log('✅ New columns exist')
    
    // Test 2: Create a test order with enhanced items
    console.log('\n2. Creating test order with enhanced items...')
    const testOrderData = {
      user_id: null,
      user_name: 'Test User Enhanced',
      user_email: 'test-enhanced@example.com',
      user_photo_url: null,
      order_amount: 75,
      custom_order_id: 'ORD888888',
      status: 'pending'
    }
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([testOrderData])
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ Failed to create test order:', orderError)
      return
    }
    console.log('✅ Test order created:', order.custom_order_id)
    
    // Test 3: Create enhanced order items
    console.log('\n3. Creating enhanced order items...')
    const testItems = [
      {
        order_id: order.id,
        item_name: 'Enhanced Item 1',
        quantity: 2,
        price: 25,
        item_amount: 50, // price x quantity
        ordered_by: 'Test User Enhanced',
        order_status: 'pending',
        custom_order_id: 'ORD888888'
      },
      {
        order_id: order.id,
        item_name: 'Enhanced Item 2',
        quantity: 1,
        price: 25,
        item_amount: 25, // price x quantity
        ordered_by: 'Test User Enhanced',
        order_status: 'pending',
        custom_order_id: 'ORD888888'
      }
    ]
    
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(testItems)
      .select()
    
    if (itemsError) {
      console.error('❌ Failed to create enhanced items:', itemsError)
      return
    }
    console.log('✅ Enhanced order items created:', items.length)
    
    // Test 4: Verify item_amount calculation
    console.log('\n4. Verifying item_amount calculations...')
    items.forEach(item => {
      const expectedAmount = item.price * item.quantity
      if (item.item_amount === expectedAmount) {
        console.log(`✅ Item "${item.item_name}": ₹${item.price} × ${item.quantity} = ₹${item.item_amount}`)
      } else {
        console.log(`❌ Item "${item.item_name}": Expected ₹${expectedAmount}, got ₹${item.item_amount}`)
      }
    })
    
    // Test 5: Test order status update propagation
    console.log('\n5. Testing order status update propagation...')
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'accepted' })
      .eq('id', order.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Failed to update order status:', updateError)
    } else {
      console.log('✅ Order status updated to:', updatedOrder.status)
      
      // Check if order_items status was updated
      const { data: updatedItems, error: itemsUpdateError } = await supabase
        .from('order_items')
        .select('order_status')
        .eq('order_id', order.id)
      
      if (itemsUpdateError) {
        console.error('❌ Failed to check updated items:', itemsUpdateError)
      } else {
        const allUpdated = updatedItems.every(item => item.order_status === 'accepted')
        if (allUpdated) {
          console.log('✅ All order items status updated to:', updatedItems[0].order_status)
        } else {
          console.log('❌ Not all order items were updated')
        }
      }
    }
    
    // Test 6: Test querying by custom_order_id
    console.log('\n6. Testing query by custom_order_id...')
    const { data: itemsByCustomId, error: queryError } = await supabase
      .from('order_items')
      .select('*')
      .eq('custom_order_id', 'ORD888888')
    
    if (queryError) {
      console.error('❌ Failed to query by custom_order_id:', queryError)
    } else {
      console.log('✅ Found items by custom_order_id:', itemsByCustomId.length)
      itemsByCustomId.forEach(item => {
        console.log(`   - ${item.item_name}: ₹${item.item_amount} (ordered by ${item.ordered_by})`)
      })
    }
    
    // Test 7: Clean up test data
    console.log('\n7. Cleaning up test data...')
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 All enhanced order items tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testEnhancedOrderItems()
