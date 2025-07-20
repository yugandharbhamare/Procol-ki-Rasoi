import { useState, useEffect } from 'react';
import { sendOrderConfirmation, sendReceiptImage, getOrderConfirmationNumbers } from '../services/whatsappService';
import { generateReceiptImage, generateAndSendReceipt } from '../services/receiptService';

const WhatsAppTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);

  // Mock order data for testing
  const testOrder = {
    id: 'TEST_ORDER_001',
    timestamp: new Date().toISOString(),
    user: {
      email: 'test@example.com',
      displayName: 'Test Customer',
      firstName: 'Test',
      lastName: 'Customer'
    },
    items: {
      item1: {
        name: 'Masala Chai',
        price: 10,
        quantity: 2,
        image: '☕'
      },
      item2: {
        name: 'Veg Butter Maggi',
        price: 30,
        quantity: 1,
        image: '🍜'
      }
    },
    total: 50,
    paymentDetails: {
      transactionId: 'TXN_TEST_001',
      paymentMethod: 'UPI',
      amount: 50,
      status: 'success'
    }
  };

  // Debug logging on component mount
  useEffect(() => {
    console.log('🧪 WhatsAppTest component mounted');
    console.log('📱 Configured numbers:', getOrderConfirmationNumbers());
    console.log('🌍 Environment:', import.meta.env.DEV ? 'Development' : 'Production');
  }, []);

  const addResult = (test, status, details = '') => {
    console.log(`🧪 Test Result: ${test} - ${status} - ${details}`);
    setTestResults(prev => [...prev, { test, status, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    console.log('🧪 Starting WhatsApp integration tests...');
    setIsTesting(true);
    setTestResults([]);

    try {
      // Test 1: Check configured mobile numbers
      addResult('📱 Mobile Numbers', 'running', 'Checking configured numbers...');
      const numbers = getOrderConfirmationNumbers();
      console.log('📱 Numbers retrieved:', numbers);
      addResult('📱 Mobile Numbers', 'success', `Configured: ${numbers.join(', ')}`);

      // Test 2: Test order confirmation message
      addResult('📨 Order Confirmation', 'running', 'Testing message sending...');
      console.log('📨 Sending order confirmation...');
      const confirmationResult = await sendOrderConfirmation(testOrder);
      console.log('📨 Confirmation result:', confirmationResult);
      if (confirmationResult.success) {
        addResult('📨 Order Confirmation', 'success', `Sent to ${confirmationResult.numbersContacted} numbers`);
      } else {
        addResult('📨 Order Confirmation', 'error', confirmationResult.error);
      }

      // Test 3: Test receipt image generation
      addResult('🖼️ Receipt Generation', 'running', 'Generating receipt image...');
      console.log('🖼️ Generating receipt image...');
      const imageResult = await generateReceiptImage(testOrder);
      console.log('🖼️ Image result:', imageResult);
      if (imageResult.success && imageResult.imageUrl) {
        addResult('🖼️ Receipt Generation', 'success', `Image generated (${Math.round(imageResult.imageUrl.length / 1024)}KB)`);
      } else {
        addResult('🖼️ Receipt Generation', 'error', imageResult.error);
      }

      // Test 4: Test receipt image sending
      addResult('📤 Receipt Sending', 'running', 'Sending receipt image...');
      if (imageResult.success) {
        console.log('📤 Sending receipt image...');
        const sendResult = await sendReceiptImage(testOrder, imageResult.imageUrl);
        console.log('📤 Send result:', sendResult);
        if (sendResult.success) {
          addResult('📤 Receipt Sending', 'success', `Sent to ${sendResult.numbersContacted} numbers`);
        } else {
          addResult('📤 Receipt Sending', 'error', sendResult.error);
        }
      } else {
        addResult('📤 Receipt Sending', 'error', 'Cannot send - image generation failed');
      }

      // Test 5: Test complete integration flow
      addResult('🔄 Complete Flow', 'running', 'Testing complete integration...');
      console.log('🔄 Testing complete integration flow...');
      const completeResult = await generateAndSendReceipt(testOrder);
      console.log('🔄 Complete result:', completeResult);
      if (completeResult.success) {
        addResult('🔄 Complete Flow', 'success', 'All components working correctly');
      } else {
        addResult('🔄 Complete Flow', 'error', completeResult.error);
      }

    } catch (error) {
      console.error('❌ Test error:', error);
      addResult('❌ Test Error', 'error', error.message);
    } finally {
      setIsTesting(false);
      console.log('🧪 Tests completed');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Integration Test</h2>
        <p className="text-gray-600 mb-4">
          Test the WhatsApp integration components. In development mode, messages are logged but not actually sent.
        </p>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={runTests}
            disabled={isTesting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
          >
            {isTesting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Testing...</span>
              </>
            ) : (
              <>
                <span>🧪</span>
                <span>Run Tests</span>
              </>
            )}
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        {testResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🧪</div>
            <p>Click "Run Tests" to start testing the WhatsApp integration</p>
            <p className="text-sm mt-2">Check browser console for detailed logs</p>
          </div>
        ) : (
          testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success' ? 'bg-green-50 border-green-200' :
                result.status === 'error' ? 'bg-red-50 border-red-200' :
                result.status === 'running' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{result.test}</span>
                  {result.status === 'success' && <span className="text-green-600">✅</span>}
                  {result.status === 'error' && <span className="text-red-600">❌</span>}
                  {result.status === 'running' && <span className="text-blue-600">⏳</span>}
                </div>
                <span className="text-sm text-gray-500">{result.timestamp}</span>
              </div>
              {result.details && (
                <p className={`mt-2 text-sm ${
                  result.status === 'success' ? 'text-green-700' :
                  result.status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {result.details}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {testResults.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Test Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Tests:</span>
              <span className="ml-2">{testResults.length}</span>
            </div>
            <div>
              <span className="font-medium">Successful:</span>
              <span className="ml-2 text-green-600">
                {testResults.filter(r => r.status === 'success').length}
              </span>
            </div>
            <div>
              <span className="font-medium">Failed:</span>
              <span className="ml-2 text-red-600">
                {testResults.filter(r => r.status === 'error').length}
              </span>
            </div>
            <div>
              <span className="font-medium">Running:</span>
              <span className="ml-2 text-blue-600">
                {testResults.filter(r => r.status === 'running').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Configuration</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Mobile Numbers:</strong> {getOrderConfirmationNumbers().join(', ')}</p>
          <p><strong>Environment:</strong> {import.meta.env.DEV ? 'Development (Logging Only)' : 'Production (Real Messages)'}</p>
          <p><strong>API Status:</strong> {import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN ? 'Configured' : 'Not Configured'}</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTest; 