// Script to clean up localStorage orders that shouldn't exist
// Run this in browser console to clean up local storage

console.log('🧹 Cleaning up localStorage orders...');

// List of localStorage keys that might contain order data
const orderKeys = [
  'completedOrders',
  'ordersToSync', 
  'googleSheetsOrders',
  'googleSheetsOrdersConverted',
  'orders',
  'pendingOrders',
  'acceptedOrders', 
  'completedOrders',
  'cancelledOrders'
];

// Remove all order-related localStorage keys
orderKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`Removing localStorage key: ${key}`);
    localStorage.removeItem(key);
  }
});

// Also remove any keys that contain 'order' or 'Order' or 'ORD'
const allKeys = Object.keys(localStorage);
allKeys.forEach(key => {
  if (key.toLowerCase().includes('order') || key.includes('ORD')) {
    console.log(`Removing localStorage key: ${key}`);
    localStorage.removeItem(key);
  }
});

console.log('✅ localStorage cleanup complete!');
console.log('Remaining localStorage keys:', Object.keys(localStorage));
