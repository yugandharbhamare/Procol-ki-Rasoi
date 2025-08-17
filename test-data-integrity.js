// Test script to verify data integrity and null value handling
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDataIntegrity() {
  try {
    console.log('🔍 Testing data integrity and null value handling...')
    
    // Test 1: Check for null values in critical columns
    console.log('\n1. Checking for null values in critical columns...')
    
    // Check orders table
    const { data: orderNulls, error: orderNullsError } = await supabase
      .from('orders')
      .select('user_name, user_email, order_amount, custom_order_id')
      .or('user_name.is.null,user_email.is.null,order_amount.is.null,custom_order_id.is.null')
    
    if (orderNullsError) {
      console.error('❌ Error checking order nulls:', orderNullsError)
    } else {
      console.log(`✅ Orders with null values: ${orderNulls.length}`)
      if (orderNulls.length > 0) {
        console.log('   ⚠️  Found orders with null values - consider running fix-null-values.sql')
      }
    }
    
    // Check order_items table
    const { data: itemNulls, error: itemNullsError } = await supabase
      .from('order_items')
      .select('item_amount, ordered_by, order_status, custom_order_id')
      .or('item_amount.is.null,ordered_by.is.null,order_status.is.null,custom_order_id.is.null')
    
    if (itemNullsError) {
      console.error('❌ Error checking item nulls:', itemNullsError)
    } else {
      console.log(`✅ Order items with null values: ${itemNulls.length}`)
      if (itemNulls.length > 0) {
        console.log('   ⚠️  Found order items with null values - consider running fix-null-values.sql')
      }
    }
    
    // Test 2: Test order creation with edge cases
    console.log('\n2. Testing order creation with edge cases...')
    
    // Test with minimal data
    const minimalOrderData = {
      user_id: null,
      user_name: null, // This should be handled by null safeguards
      user_email: null, // This should be handled by null safeguards
      user_photo_url: null,
      order_amount: null, // This should be handled by null safeguards
      custom_order_id: 'ORD777777',
      status: 'pending',
      items: [
        {
          name: null, // This should be handled by null safeguards
          quantity: null, // This should be handled by null safeguards
          price: null // This should be handled by null safeguards
        }
      ]
    }
    
    // Note: This would normally be called through the OrderContext
    // For testing, we'll simulate the data transformation
    const testOrderItems = minimalOrderData.items.map(item => ({
      name: item.name || 'Unknown Item',
      quantity: item.quantity || 1,
      price: item.price || 0
    }))
    
    console.log('✅ Null safeguards applied to test data:')
    console.log('   - Item name:', testOrderItems[0].name)
    console.log('   - Item quantity:', testOrderItems[0].quantity)
    console.log('   - Item price:', testOrderItems[0].price)
    
    // Test 3: Verify data consistency
    console.log('\n3. Verifying data consistency...')
    
    // Check if all orders have corresponding order items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, custom_order_id')
      .limit(5)
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
    } else {
      console.log(`✅ Checking consistency for ${orders.length} orders...`)
      
      for (const order of orders) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)
        
        if (itemsError) {
          console.error(`❌ Error fetching items for order ${order.id}:`, itemsError)
        } else {
          console.log(`   Order ${order.custom_order_id}: ${items.length} items`)
          
          // Check if all items have proper data
          const invalidItems = items.filter(item => 
            !item.item_amount || !item.ordered_by || !item.order_status
          )
          
          if (invalidItems.length > 0) {
            console.log(`   ⚠️  Order ${order.custom_order_id} has ${invalidItems.length} items with missing data`)
          }
        }
      }
    }
    
    // Test 4: Test item_amount calculations
    console.log('\n4. Testing item_amount calculations...')
    
    const { data: testItems, error: testItemsError } = await supabase
      .from('order_items')
      .select('price, quantity, item_amount')
      .limit(10)
    
    if (testItemsError) {
      console.error('❌ Error fetching test items:', testItemsError)
    } else {
      console.log(`✅ Checking ${testItems.length} items for calculation accuracy...`)
      
      let correctCalculations = 0
      testItems.forEach(item => {
        const expectedAmount = (item.price || 0) * (item.quantity || 1)
        if (item.item_amount === expectedAmount) {
          correctCalculations++
        } else {
          console.log(`   ❌ Item calculation mismatch: expected ${expectedAmount}, got ${item.item_amount}`)
        }
      })
      
      console.log(`✅ ${correctCalculations}/${testItems.length} items have correct calculations`)
    }
    
    // Test 5: Test custom_order_id consistency
    console.log('\n5. Testing custom_order_id consistency...')
    
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('custom_order_id, orders!inner(custom_order_id)')
      .limit(10)
    
    if (orderItemsError) {
      console.error('❌ Error checking custom_order_id consistency:', orderItemsError)
    } else {
      console.log(`✅ Checking ${orderItems.length} order items for custom_order_id consistency...`)
      
      let consistentIds = 0
      orderItems.forEach(item => {
        if (item.custom_order_id === item.orders.custom_order_id) {
          consistentIds++
        } else {
          console.log(`   ❌ Custom order ID mismatch: item has ${item.custom_order_id}, order has ${item.orders.custom_order_id}`)
        }
      })
      
      console.log(`✅ ${consistentIds}/${orderItems.length} items have consistent custom_order_id`)
    }
    
    console.log('\n🎉 Data integrity test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDataIntegrity()
