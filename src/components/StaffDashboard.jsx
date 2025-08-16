import { useState, useEffect } from 'react';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import { useStaffOrders } from '../contexts/StaffOrderContext';
import OrderCard from './OrderCard';
import StaffHeader from './StaffHeader';
import NotificationSound from './NotificationSound';

export default function StaffDashboard() {
  const { staffUser, signOutUser } = useStaffAuth();
  const { 
    pendingOrders, 
    acceptedOrders, 
    readyOrders, 
    loading, 
    error,
    getOrderCounts 
  } = useStaffOrders();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [showNotifications, setShowNotifications] = useState(true);
  const [playNotification, setPlayNotification] = useState(false);

  const orderCounts = getOrderCounts();

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (orderCounts.pending > 0) {
      const timer = setTimeout(() => {
        setShowNotifications(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderCounts.pending]);

  // Sound notification for new orders
  useEffect(() => {
    if (orderCounts.pending > 0 && showNotifications) {
      setPlayNotification(true);
    }
  }, [orderCounts.pending, showNotifications]);

  const handleNotificationComplete = () => {
    setPlayNotification(false);
  };

  // Debug function to test Supabase order creation
  const testOrderCreation = async () => {
    try {
      console.log('StaffDashboard: Testing Supabase order creation...');
      const { createOrder, ORDER_STATUS } = await import('../services/supabaseService');
      
      const testOrder = {
        user_id: 'test-user-' + Date.now(),
        order_amount: 100,
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            price: 100
          }
        ]
      };
      
      console.log('StaffDashboard: Creating test order:', testOrder);
      const result = await createOrder(testOrder);
      console.log('StaffDashboard: Test order creation result:', result);
      
      if (result.success) {
        alert('✅ Test order created successfully! Check the pending orders tab.');
      } else {
        alert('❌ Test order creation failed: ' + result.error);
      }
    } catch (error) {
      console.error('StaffDashboard: Test order creation error:', error);
      alert('❌ Test order creation error: ' + error.message);
    }
  };

  // Debug function to test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log('StaffDashboard: Testing Supabase connection...');
      const { getAllOrders } = await import('../services/supabaseService');
      
      const result = await getAllOrders();
      console.log('StaffDashboard: Supabase connection test result:', result);
      
      if (result.success) {
        alert(`✅ Supabase connection successful! Found ${result.orders?.length || 0} orders.`);
      } else {
        alert('❌ Supabase connection failed: ' + result.error);
      }
      
    } catch (error) {
      console.error('StaffDashboard: Supabase connection test error:', error);
      alert('❌ Supabase connection failed: ' + error.message);
    }
  };

  // Debug function to test order acceptance flow
  const testOrderAcceptanceFlow = async () => {
    try {
      console.log('StaffDashboard: Testing order acceptance flow...');
      const { createOrder, ORDER_STATUS } = await import('../services/supabaseService');
      
      // Create a test order
      const testOrder = {
        user_id: 'test-user-' + Date.now(),
        order_amount: 300,
        items: [
          {
            name: 'Test Item for Acceptance',
            quantity: 2,
            price: 150
          }
        ]
      };
      
      console.log('StaffDashboard: Creating test order for acceptance flow:', testOrder);
      const createResult = await createOrder(testOrder);
      console.log('StaffDashboard: Test order creation result:', createResult);
      
      if (createResult.success) {
        alert('✅ Test order created! Now testing acceptance...');
        
        // Wait a moment for the order to appear in the pending list
        setTimeout(async () => {
          try {
            console.log('StaffDashboard: Testing order acceptance for order:', createResult.order.id);
            const acceptResult = await acceptOrder(createResult.order.id);
            console.log('StaffDashboard: Order acceptance result:', acceptResult);
            
            if (acceptResult.success) {
              alert('✅ Order acceptance test completed! Check the "In Preparation" tab.');
            } else {
              alert('❌ Order acceptance test failed: ' + acceptResult.error);
            }
          } catch (error) {
            console.error('StaffDashboard: Order acceptance test error:', error);
            alert('❌ Order acceptance test error: ' + error.message);
          }
        }, 2000);
      } else {
        alert('❌ Test order creation failed: ' + createResult.error);
      }
    } catch (error) {
      console.error('StaffDashboard: Order acceptance flow test error:', error);
      alert('❌ Order acceptance flow test error: ' + error.message);
    }
  };

  const renderOrders = (orders, status) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Connection Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Please check your Supabase configuration and try refreshing the page.
            </p>
          </div>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {status} orders</h3>
          <p className="text-gray-500">All caught up! Check back later for new orders.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} status={status} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffHeader 
        staffUser={staffUser} 
        onSignOut={signOutUser}
        orderCounts={orderCounts}
        showNotifications={showNotifications}
      />

      {/* Notification Sound */}
      <NotificationSound 
        play={playNotification} 
        onPlayComplete={handleNotificationComplete} 
      />

      {/* Notification Banner */}
      {orderCounts.pending > 0 && showNotifications && (
        <div className="bg-orange-500 text-white px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">
                {orderCounts.pending} new order{orderCounts.pending > 1 ? 's' : ''} awaiting confirmation
              </span>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-white hover:text-orange-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Debug Information</h3>
          <div className="text-sm text-yellow-700 space-y-1 mb-3">
            <p>• Pending Orders: {orderCounts.pending} {pendingOrders.length > 0 && `(${pendingOrders.map(o => o.id).join(', ')})`}</p>
            <p>• Accepted Orders: {orderCounts.accepted} {acceptedOrders.length > 0 && `(${acceptedOrders.map(o => o.id).join(', ')})`}</p>
            <p>• Ready Orders: {orderCounts.ready} {readyOrders.length > 0 && `(${readyOrders.map(o => o.id).join(', ')})`}</p>
            <p>• Loading: {loading ? 'Yes' : 'No'}</p>
            <p>• Error: {error || 'None'}</p>
          </div>
          <button
            onClick={testOrderCreation}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            🧪 Test Order Creation
          </button>
          <button
            onClick={testOrderAcceptanceFlow}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium ml-2"
          >
            ✅ Test Order Acceptance Flow
          </button>
          <button
            onClick={testSupabaseConnection}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium ml-2"
          >
            🔗 Test Supabase Connection
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
              {orderCounts.pending > 0 && (
                <span className="ml-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                  {orderCounts.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'accepted'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In Preparation
              {orderCounts.accepted > 0 && (
                <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                  {orderCounts.accepted}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ready'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ready
              {orderCounts.ready > 0 && (
                <span className="ml-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                  {orderCounts.ready}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Order Content */}
        <div className="space-y-6">
          {activeTab === 'pending' && renderOrders(pendingOrders, 'pending')}
          {activeTab === 'accepted' && renderOrders(acceptedOrders, 'accepted')}
          {activeTab === 'ready' && renderOrders(readyOrders, 'ready')}
        </div>
      </div>
    </div>
  );
}
