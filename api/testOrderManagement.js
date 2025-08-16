const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data for order creation
const testOrderData = {
  items: [
    { name: "Plain Maggi", quantity: 2 },
    { name: "Coca Cola", quantity: 1 },
    { name: "Bhel Puri", quantity: 1 }
  ],
  user: {
    email: "test@example.com",
    displayName: "Test Customer",
    firstName: "Test",
    lastName: "Customer",
    phone: "+1234567890"
  },
  paymentDetails: {
    status: "success",
    method: "UPI",
    transactionId: "txn_test_123456"
  },
  notes: "Extra spicy please"
};

let createdOrderId = null;

async function testOrderManagementAPI() {
  console.log('🧪 Testing Order Management API\n');

  try {
    // Test 1: Create Order
    console.log('1️⃣ Testing Order Creation...');
    const createResponse = await axios.post(`${BASE_URL}/api/order-management/create`, testOrderData);
    console.log('✅ Order Creation:', createResponse.data);
    
    if (createResponse.data.success) {
      createdOrderId = createResponse.data.orderId;
      console.log(`📝 Created Order ID: ${createdOrderId}`);
    }
    console.log('');

    if (!createdOrderId) {
      console.log('❌ Cannot proceed with tests without a valid order ID');
      return;
    }

    // Test 2: Get Order by ID
    console.log('2️⃣ Testing Get Order by ID...');
    const getOrderResponse = await axios.get(`${BASE_URL}/api/order-management/${createdOrderId}`);
    console.log('✅ Get Order:', {
      orderId: getOrderResponse.data.order.id,
      status: getOrderResponse.data.order.status,
      total: getOrderResponse.data.order.total
    });
    console.log('');

    // Test 3: Accept Order
    console.log('3️⃣ Testing Accept Order...');
    const acceptResponse = await axios.post(`${BASE_URL}/api/order-management/${createdOrderId}/accept`, {
      acceptedBy: 'test_staff',
      notes: 'Starting preparation'
    });
    console.log('✅ Accept Order:', acceptResponse.data);
    console.log('');

    // Test 4: Mark Order as Ready
    console.log('4️⃣ Testing Mark Order as Ready...');
    const readyResponse = await axios.post(`${BASE_URL}/api/order-management/${createdOrderId}/ready`, {
      markedReadyBy: 'test_staff',
      notes: 'Order is ready for pickup'
    });
    console.log('✅ Mark Ready:', readyResponse.data);
    console.log('');

    // Test 5: Complete Order
    console.log('5️⃣ Testing Complete Order...');
    const completeResponse = await axios.post(`${BASE_URL}/api/order-management/${createdOrderId}/complete`, {
      completedBy: 'test_staff',
      notes: 'Order delivered to customer'
    });
    console.log('✅ Complete Order:', completeResponse.data);
    console.log('');

    // Test 6: Get Orders by Status
    console.log('6️⃣ Testing Get Orders by Status...');
    const pendingOrdersResponse = await axios.get(`${BASE_URL}/api/order-management/status/pending`);
    const acceptedOrdersResponse = await axios.get(`${BASE_URL}/api/order-management/status/accepted`);
    const readyOrdersResponse = await axios.get(`${BASE_URL}/api/order-management/status/ready`);
    const completedOrdersResponse = await axios.get(`${BASE_URL}/api/order-management/status/completed`);

    console.log('✅ Orders by Status:');
    console.log(`   Pending: ${pendingOrdersResponse.data.count}`);
    console.log(`   Accepted: ${acceptedOrdersResponse.data.count}`);
    console.log(`   Ready: ${readyOrdersResponse.data.count}`);
    console.log(`   Completed: ${completedOrdersResponse.data.count}`);
    console.log('');

    // Test 7: Get All Orders
    console.log('7️⃣ Testing Get All Orders...');
    const allOrdersResponse = await axios.get(`${BASE_URL}/api/order-management`);
    console.log('✅ All Orders:', {
      total: allOrdersResponse.data.counts.total,
      pending: allOrdersResponse.data.counts.pending,
      accepted: allOrdersResponse.data.counts.accepted,
      ready: allOrdersResponse.data.counts.ready,
      completed: allOrdersResponse.data.counts.completed,
      cancelled: allOrdersResponse.data.counts.cancelled
    });
    console.log('');

    // Test 8: Create another order for cancellation test
    console.log('8️⃣ Testing Order Cancellation...');
    const cancelOrderData = {
      ...testOrderData,
      user: {
        ...testOrderData.user,
        email: "cancel@example.com"
      },
      paymentDetails: {
        status: "failed",
        method: "UPI",
        transactionId: "txn_failed_123"
      }
    };

    const cancelCreateResponse = await axios.post(`${BASE_URL}/api/order-management/create`, cancelOrderData);
    const cancelOrderId = cancelCreateResponse.data.orderId;

    const cancelResponse = await axios.post(`${BASE_URL}/api/order-management/${cancelOrderId}/cancel`, {
      cancellationReason: 'Payment failed',
      cancelledBy: 'test_staff'
    });
    console.log('✅ Cancel Order:', cancelResponse.data);
    console.log('');

    // Test 9: Update Order Status (Generic)
    console.log('9️⃣ Testing Generic Status Update...');
    const statusUpdateResponse = await axios.put(`${BASE_URL}/api/order-management/${createdOrderId}/status`, {
      status: 'completed',
      additionalData: {
        completedBy: 'test_staff_generic',
        notes: 'Updated via generic endpoint'
      }
    });
    console.log('✅ Status Update:', statusUpdateResponse.data);
    console.log('');

    // Test 10: Error Handling
    console.log('🔟 Testing Error Handling...');
    
    // Test invalid order ID
    try {
      await axios.get(`${BASE_URL}/api/order-management/invalid_order_id`);
    } catch (error) {
      console.log('✅ Invalid Order ID Error:', error.response.data);
    }

    // Test invalid status
    try {
      await axios.put(`${BASE_URL}/api/order-management/${createdOrderId}/status`, {
        status: 'invalid_status'
      });
    } catch (error) {
      console.log('✅ Invalid Status Error:', error.response.data);
    }

    console.log('');

    console.log('🎉 All Order Management API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Test order lifecycle simulation
async function testOrderLifecycle() {
  console.log('🔄 Testing Complete Order Lifecycle\n');

  try {
    // Step 1: Create Order
    console.log('📝 Step 1: Creating order...');
    const createResponse = await axios.post(`${BASE_URL}/api/order-management/create`, testOrderData);
    const orderId = createResponse.data.orderId;
    console.log(`✅ Order created with ID: ${orderId}`);
    console.log(`   Status: ${createResponse.data.order.status}`);
    console.log(`   Total: ₹${createResponse.data.order.total}`);
    console.log('');

    // Step 2: Accept Order
    console.log('✅ Step 2: Accepting order...');
    const acceptResponse = await axios.post(`${BASE_URL}/api/order-management/${orderId}/accept`);
    console.log(`✅ Order accepted: ${acceptResponse.data.message}`);
    console.log('');

    // Step 3: Mark as Ready
    console.log('🔥 Step 3: Marking order as ready...');
    const readyResponse = await axios.post(`${BASE_URL}/api/order-management/${orderId}/ready`);
    console.log(`✅ Order ready: ${readyResponse.data.message}`);
    console.log('');

    // Step 4: Complete Order
    console.log('🎉 Step 4: Completing order...');
    const completeResponse = await axios.post(`${BASE_URL}/api/order-management/${orderId}/complete`);
    console.log(`✅ Order completed: ${completeResponse.data.message}`);
    console.log('');

    // Step 5: Verify Final Status
    console.log('🔍 Step 5: Verifying final status...');
    const finalOrderResponse = await axios.get(`${BASE_URL}/api/order-management/${orderId}`);
    console.log(`✅ Final status: ${finalOrderResponse.data.order.status}`);
    console.log(`   Timeline:`);
    console.log(`   - Created: ${finalOrderResponse.data.order.createdAt}`);
    console.log(`   - Accepted: ${finalOrderResponse.data.order.acceptedAt}`);
    console.log(`   - Ready: ${finalOrderResponse.data.order.readyAt}`);
    console.log(`   - Completed: ${finalOrderResponse.data.order.completedAt}`);
    console.log('');

    console.log('🎊 Order lifecycle completed successfully!');

  } catch (error) {
    console.error('❌ Lifecycle test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Run basic tests
  testOrderManagementAPI().then(() => {
    console.log('\n' + '='.repeat(50) + '\n');
    // Run lifecycle test
    return testOrderLifecycle();
  });
}

module.exports = { testOrderManagementAPI, testOrderLifecycle };
