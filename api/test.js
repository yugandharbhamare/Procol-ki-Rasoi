const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const testOrder = {
  items: [
    { name: "Plain Maggi", quantity: 2 },
    { name: "Coca Cola", quantity: 1 },
    { name: "Bhel Puri", quantity: 1 },
    { name: "Amul Lassi", quantity: 2 }
  ]
};

const testItems = ["Plain Maggi", "Coca Cola", "Invalid Item", "Bhel Puri"];

async function testAPI() {
  console.log('🧪 Testing Procol ki Rasoi API\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Get Menu
    console.log('2️⃣ Testing Get Menu...');
    const menuResponse = await axios.get(`${BASE_URL}/api/orders/menu`);
    console.log('✅ Menu Items Count:', Object.keys(menuResponse.data.data.items).length);
    console.log('Sample items:', Object.entries(menuResponse.data.data.items).slice(0, 5));
    console.log('');

    // Test 3: Calculate Order
    console.log('3️⃣ Testing Order Calculation...');
    const calculateResponse = await axios.post(`${BASE_URL}/api/orders/calculate`, testOrder);
    console.log('✅ Order Calculation:');
    console.log('Breakdown:', calculateResponse.data.data.breakdown);
    console.log('Subtotal:', calculateResponse.data.data.subtotal);
    console.log('Tax:', calculateResponse.data.data.tax);
    console.log('Total:', calculateResponse.data.data.total);
    console.log('');

    // Test 4: Validate Single Item
    console.log('4️⃣ Testing Single Item Validation...');
    const validateResponse = await axios.get(`${BASE_URL}/api/orders/validate/Plain%20Maggi`);
    console.log('✅ Item Validation:', validateResponse.data.data);
    console.log('');

    // Test 5: Validate Batch Items
    console.log('5️⃣ Testing Batch Item Validation...');
    const batchResponse = await axios.post(`${BASE_URL}/api/orders/validate-batch`, {
      items: testItems
    });
    console.log('✅ Batch Validation:');
    console.log('Valid Items:', batchResponse.data.data.validItems);
    console.log('Invalid Items:', batchResponse.data.data.invalidItems);
    console.log('Results:', batchResponse.data.data.results);
    console.log('');

    // Test 6: Error Handling - Invalid Item
    console.log('6️⃣ Testing Error Handling (Invalid Item)...');
    try {
      const errorResponse = await axios.post(`${BASE_URL}/api/orders/calculate`, {
        items: [{ name: "Invalid Item", quantity: 1 }]
      });
    } catch (error) {
      console.log('✅ Error Handling:', error.response.data);
    }
    console.log('');

    // Test 7: Error Handling - Invalid Quantity
    console.log('7️⃣ Testing Error Handling (Invalid Quantity)...');
    try {
      const errorResponse = await axios.post(`${BASE_URL}/api/orders/calculate`, {
        items: [{ name: "Plain Maggi", quantity: -1 }]
      });
    } catch (error) {
      console.log('✅ Error Handling:', error.response.data);
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
