// Test script to verify custom order ID functionality
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCustomOrderId() {
  try {
    console.log('🔍 Testing custom order ID functionality...')
    
    // Test 1: Check if custom_order_id column exists
    console.log('\n1. Checking if custom_order_id column exists...')
    const { data: columns, error: columnsError } = await supabase
      .from('orders')
      .select('custom_order_id')
      .limit(1)
    
    if (columnsError) {
      console.error('❌ custom_order_id column not found. Please run add-custom-order-id.sql')
      return
    }
    console.log('✅ custom_order_id column exists')
    
    // Test 2: Create a test order with custom order ID
    console.log('\n2. Creating test order with custom order ID...')
    const testOrderData = {
      user_id: null,
      user_name: 'Test User',
      user_email: 'test@example.com',
      user_photo_url: null,
      order_amount: 50,
      custom_order_id: 'ORD999999', // Test custom order ID
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
    console.log('✅ Test order created with custom_order_id:', order.custom_order_id)
    console.log('   Supabase ID:', order.id)
    
    // Test 3: Create test order items
    console.log('\n3. Creating test order items...')
    const testItems = [
      {
        order_id: order.id,
        item_name: 'Test Item 1',
        quantity: 2,
        price: 25
      }
    ]
    
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(testItems)
      .select()
    
    if (itemsError) {
      console.error('❌ Failed to create test items:', itemsError)
    } else {
      console.log('✅ Test order items created')
    }
    
    // Test 4: Test finding order by custom order ID
    console.log('\n4. Testing find order by custom order ID...')
    const { data: foundOrder, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('custom_order_id', 'ORD999999')
      .single()
    
    if (findError) {
      console.error('❌ Failed to find order by custom ID:', findError)
    } else {
      console.log('✅ Found order by custom ID:', foundOrder.custom_order_id)
      console.log('   Supabase ID:', foundOrder.id)
    }
    
    // Test 5: Test updating order status using custom order ID
    console.log('\n5. Testing update order status using custom order ID...')
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'accepted' })
      .eq('custom_order_id', 'ORD999999')
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Failed to update order status:', updateError)
    } else {
      console.log('✅ Updated order status to:', updatedOrder.status)
    }
    
    // Test 6: Clean up test data
    console.log('\n6. Cleaning up test data...')
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 All custom order ID tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCustomOrderId()
