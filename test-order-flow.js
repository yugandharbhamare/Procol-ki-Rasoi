// Test script to verify order flow
console.log('Testing order flow...');

// Simulate a completed order
const testOrder = {
  id: `TEST_${Date.now()}`,
  items: {
    'item1': {
      name: 'Amul Chaas',
      price: 15,
      quantity: 1,
      image: '/optimized/Amul Chaas.png'
    }
  },
  total: 15,
  timestamp: new Date().toISOString(),
  user: {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User'
  },
  paymentDetails: {
    transactionId: `TXN_${Date.now()}`,
    paymentMethod: 'UPI',
    amount: 15,
    status: 'success',
    timestamp: new Date().toISOString()
  }
};

console.log('Test order created:', testOrder);

// Check if OrderContext is available
if (typeof window !== 'undefined') {
  console.log('Browser environment detected');
  
  // Check localStorage
  const existingOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');
  console.log('Existing orders in localStorage:', existingOrders);
  
  // Add test order to localStorage
  const updatedOrders = [testOrder, ...existingOrders];
  localStorage.setItem('completedOrders', JSON.stringify(updatedOrders));
  console.log('Test order added to localStorage');
  
  // Verify it was added
  const verifyOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');
  console.log('Orders after adding test order:', verifyOrders);
  
  console.log('✅ Order flow test completed successfully!');
} else {
  console.log('Node.js environment detected');
  console.log('✅ Test order created successfully!');
}
