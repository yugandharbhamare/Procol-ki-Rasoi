// Test Supabase order creation
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.log('Please check your .env file has:')
  console.log('VITE_SUPABASE_URL=your_supabase_url')
  console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseOrderCreation() {
  try {
    console.log('🔍 Testing Supabase order creation...')
    
    // Test order data
    const testOrderData = {
      user_id: null, // Will be null for test
      user_name: 'Test User',
      user_email: 'test@example.com',
      user_photo_url: null,
      order_amount: 25,
      status: 'pending',
      items: [
        {
          name: 'Amul Chaas',
          quantity: 1,
          price: 15
        },
        {
          name: 'Ginger Chai',
          quantity: 1,
          price: 10
        }
      ]
    }
    
    console.log('🔍 Test order data:', testOrderData)
    
    // Test 1: Check if we can connect to Supabase
    console.log('🔍 Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('orders')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Supabase connection failed:', connectionError)
      return
    }
    
    console.log('✅ Supabase connection successful')
    
    // Test 2: Check if the new columns exist
    console.log('🔍 Checking if new columns exist...')
    const { data: columnsTest, error: columnsError } = await supabase
      .from('orders')
      .select('user_name, user_email, user_photo_url')
      .limit(1)
    
    if (columnsError) {
      console.error('❌ New columns not found. Please run the SQL scripts:')
      console.log('1. add-user-columns-to-orders.sql')
      console.log('2. add-photo-url-column.sql')
      console.log('3. add-user-photo-url-to-orders.sql')
      return
    }
    
    console.log('✅ New columns exist')
    
    // Test 3: Try to create an order
    console.log('🔍 Testing order creation...')
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([testOrderData])
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ Order creation failed:', orderError)
      return
    }
    
    console.log('✅ Order created successfully:', order)
    
    // Test 4: Try to create order items
    console.log('🔍 Testing order items creation...')
    const orderItems = testOrderData.items.map(item => ({
      order_id: order.id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price
    }))
    
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()
    
    if (itemsError) {
      console.error('❌ Order items creation failed:', itemsError)
      return
    }
    
    console.log('✅ Order items created successfully:', items)
    
    // Test 5: Fetch the complete order
    console.log('🔍 Testing order retrieval...')
    const { data: fetchedOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .single()
    
    if (fetchError) {
      console.error('❌ Order retrieval failed:', fetchError)
      return
    }
    
    console.log('✅ Order retrieved successfully:', fetchedOrder)
    
    // Clean up: Delete test order
    console.log('🔍 Cleaning up test data...')
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    
    console.log('✅ Test completed successfully! Supabase order creation is working.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSupabaseOrderCreation()
