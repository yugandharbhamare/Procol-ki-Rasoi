// Test script to debug payment flow and Google Sheets integration
// Run this in browser console to test the payment system

// Test order data
const testOrder = {
  id: 'ORD' + Date.now(),
  items: {
    1: { name: 'Masala Chai', price: 10, quantity: 2, image: '🍵' },
    2: { name: 'Plain Maggi', price: 20, quantity: 1, image: '🍜' }
  },
  user: {
    email: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User'
  },
  timestamp: new Date().toISOString()
}

console.log('Test order:', testOrder)

// Test payment initialization
async function testPaymentFlow() {
  try {
    console.log('=== Testing Payment Flow ===')
    
    // Import payment service
    const { initializePayment, simulatePaymentConfirmation, getPaymentStatus } = await import('./src/services/paymentService.js')
    
    // Step 1: Initialize payment
    console.log('1. Initializing payment...')
    const initResult = await initializePayment(testOrder)
    console.log('Init result:', initResult)
    
    // Step 2: Check payment status
    console.log('2. Checking payment status...')
    const status = getPaymentStatus(testOrder.id)
    console.log('Payment status:', status)
    
    // Step 3: Simulate payment confirmation
    console.log('3. Simulating payment confirmation...')
    const confirmResult = await simulatePaymentConfirmation(testOrder.id)
    console.log('Confirmation result:', confirmResult)
    
    // Step 4: Check final status
    console.log('4. Checking final payment status...')
    const finalStatus = getPaymentStatus(testOrder.id)
    console.log('Final status:', finalStatus)
    
    // Step 5: Check Google Sheets data
    console.log('5. Checking Google Sheets data...')
    const pendingOrders = JSON.parse(localStorage.getItem('ordersToSync') || '[]')
    console.log('Pending orders for Google Sheets:', pendingOrders)
    
    // Step 6: Check completed orders
    console.log('6. Checking completed orders...')
    const completedOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]')
    console.log('Completed orders:', completedOrders)
    
    console.log('=== Test Complete ===')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testPaymentFlow() 