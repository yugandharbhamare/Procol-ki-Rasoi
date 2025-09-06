import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrders } from '../contexts/OrderContext'
import { getUserByEmail, getUserOrders, subscribeToOrders } from '../services/supabaseService'
import { getDisplayOrderId, normalizeOrderForReceipt, getOrderStatusDisplay, getStatusBadgeStyle } from '../utils/orderUtils'
import ReceiptModal from './ReceiptModal'

const OrderHistory = () => {
  const { user } = useAuth()
  const { isSupabaseAvailable } = useOrders()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userOrders, setUserOrders] = useState([])
  const [pendingReceiptOrderId, setPendingReceiptOrderId] = useState(null)



  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleViewReceipt = (order) => {
    setSelectedOrder(order)
  }

  const handleCloseReceipt = () => {
    setSelectedOrder(null)
  }

  // Check for order ID in sessionStorage to auto-open receipt
  useEffect(() => {
    const orderIdToShow = sessionStorage.getItem('showReceiptForOrder');
    if (orderIdToShow) {
      console.log('OrderHistory: Found order ID in sessionStorage:', orderIdToShow);
      console.log('OrderHistory: Available orders:', userOrders.map(o => ({ id: o.id, supabase_id: o.supabase_id })));
      // Clear the sessionStorage item
      sessionStorage.removeItem('showReceiptForOrder');
      
      // Find the order and open receipt
      const orderToShow = userOrders.find(order => order.id === orderIdToShow);
      if (orderToShow) {
        console.log('OrderHistory: Opening receipt for order:', orderToShow);
        setSelectedOrder(orderToShow);
      } else {
        console.log('OrderHistory: Order not found in current orders, will check after loading');
        console.log('OrderHistory: Looking for order ID:', orderIdToShow);
        console.log('OrderHistory: Available order IDs:', userOrders.map(o => o.id));
        // Store the order ID to check after orders are loaded
        setPendingReceiptOrderId(orderIdToShow);
      }
    }
  }, [userOrders]);

  // Load and filter orders for the current user
  const loadUserOrders = async () => {
    setIsLoading(true)
    
    try {
      console.log('OrderHistory: Loading orders for user:', user.email);
      
      // Get user's Supabase UUID first
      let supabaseUserId = null;
      if (user.email) {
        const userResult = await getUserByEmail(user.email);
        if (userResult.success && userResult.user) {
          supabaseUserId = userResult.user.id;
          console.log('OrderHistory: Found Supabase user ID:', supabaseUserId);
        } else {
          console.warn('OrderHistory: User not found in Supabase');
        }
      }
      
      // Fetch orders from Supabase
      let supabaseOrders = [];
      if (supabaseUserId) {
        const supabaseResult = await getUserOrders(supabaseUserId);
        if (supabaseResult.success) {
          supabaseOrders = supabaseResult.orders;
          console.log('OrderHistory: Fetched orders from Supabase:', supabaseOrders.length);
          console.log('OrderHistory: Supabase orders details:', supabaseOrders.map(o => ({ id: o.id, supabase_id: o.supabase_id, custom_order_id: o.custom_order_id })));
        } else {
          console.error('OrderHistory: Failed to fetch orders from Supabase:', supabaseResult.error);
        }
      }
      
      // Since we're using Supabase as the single source of truth, 
      // we don't need to handle local orders anymore
      const uniqueOrders = supabaseOrders;
      
      console.log('OrderHistory: Total unique orders:', uniqueOrders.length);
      
      // Sort by timestamp (newest first)
      const sortedOrders = uniqueOrders.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at);
        const dateB = new Date(b.timestamp || b.created_at);
        return dateB - dateA;
      });
      
      setUserOrders(sortedOrders);
    } catch (error) {
      console.error('Error loading user orders:', error);
      // No fallback to local orders - Supabase is the single source of truth
      setUserOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load of orders
  useEffect(() => {
    if (user && user.email) {
      loadUserOrders();
    }
  }, [user]); // Removed completedOrders dependency to prevent unnecessary reloads

  // Check for receipt modal flag after orders are loaded
  useEffect(() => {
    if (userOrders.length > 0) {
      const orderIdToShow = sessionStorage.getItem('showReceiptForOrder');
      console.log('OrderHistory: Checking for receipt order ID:', orderIdToShow);
      console.log('OrderHistory: Current user orders count:', userOrders.length);
      
      if (orderIdToShow) {
        console.log('OrderHistory: Looking for order ID:', orderIdToShow);
        console.log('OrderHistory: Available order IDs:', userOrders.map(o => o.id));
        
        // Find the order with the matching ID
        const orderToShow = userOrders.find(order => order.id === orderIdToShow);
        if (orderToShow) {
          console.log('OrderHistory: ✅ Found order, opening receipt:', orderToShow);
          setSelectedOrder(orderToShow);
          // Clear the flag
          sessionStorage.removeItem('showReceiptForOrder');
        } else {
          console.log('OrderHistory: ❌ Order not found in current orders');
          console.log('OrderHistory: Will retry after a short delay...');
          // Don't clear sessionStorage yet, retry after a delay
          setTimeout(() => {
            const retryOrderId = sessionStorage.getItem('showReceiptForOrder');
            if (retryOrderId) {
              console.log('OrderHistory: Retrying to find order:', retryOrderId);
              const retryOrder = userOrders.find(order => order.id === retryOrderId);
              if (retryOrder) {
                console.log('OrderHistory: ✅ Found order on retry, opening receipt:', retryOrder);
                setSelectedOrder(retryOrder);
                sessionStorage.removeItem('showReceiptForOrder');
              } else {
                console.log('OrderHistory: ❌ Order still not found after retry');
                sessionStorage.removeItem('showReceiptForOrder');
              }
            }
          }, 2000); // Wait 2 seconds and retry
        }
      }
      
      // Also check for pending receipt order ID
      if (pendingReceiptOrderId) {
        console.log('OrderHistory: Checking pending receipt order ID:', pendingReceiptOrderId);
        const orderToShow = userOrders.find(order => order.id === pendingReceiptOrderId);
        if (orderToShow) {
          console.log('OrderHistory: Auto-opening receipt for pending order:', pendingReceiptOrderId);
          setSelectedOrder(orderToShow);
          setPendingReceiptOrderId(null); // Clear the pending ID
        }
      }
    }
  }, [userOrders, pendingReceiptOrderId]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!user || !user.email) return;

    console.log('OrderHistory: Setting up real-time subscription for user:', user.email);
    
    const subscription = subscribeToOrders((payload) => {
      console.log('OrderHistory: Real-time order update received:', payload);
      
      // Check if the updated order belongs to the current user
      if (payload.new && payload.new.user_id) {
        // Get user's Supabase UUID to compare
        getUserByEmail(user.email).then(userResult => {
          if (userResult.success && userResult.user && userResult.user.id === payload.new.user_id) {
            console.log('OrderHistory: Order update for current user, refreshing orders');
            // Only reload if this is a new order or status change, not just any update
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              loadUserOrders();
            }
          }
        });
      }
    });

    return () => {
      console.log('OrderHistory: Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, [user]);





  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
                      <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-600">Track your current and past orders</p>
              </div>
            </div>
        </div>
      </div>

      {/* Debug Panel - Remove this after testing */}
      <div className="container mx-auto px-4 py-2">
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Panel (Remove after testing)</h3>
          <div className="space-y-2">
            <p className="text-sm text-yellow-700">
              SessionStorage: {sessionStorage.getItem('showReceiptForOrder') || 'None'}
            </p>
            <p className="text-sm text-yellow-700">
              Pending Receipt ID: {pendingReceiptOrderId || 'None'}
            </p>
            <p className="text-sm text-yellow-700">
              Orders Count: {userOrders.length}
            </p>
            <button
              onClick={() => {
                const orderId = sessionStorage.getItem('showReceiptForOrder');
                if (orderId) {
                  const order = userOrders.find(o => o.id === orderId);
                  if (order) {
                    console.log('Manual receipt opening:', order);
                    setSelectedOrder(order);
                  } else {
                    console.log('Order not found for manual opening');
                  }
                } else {
                  console.log('No order ID in sessionStorage');
                }
              }}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              Manual Open Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading your orders...</h3>
              <p className="text-gray-500">Fetching your order history from database</p>
            </div>
          ) : (
            <>
                            {/* Orders List */}
              {userOrders.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-500">Your orders will appear here once you successfully place and pay for your first order.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => handleViewReceipt(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                                                  <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{getDisplayOrderId(order)}</h3>
                          {(() => {
                            const orderStatus = getOrderStatusDisplay(order)
                            return (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(orderStatus.color)}`}>
                                {orderStatus.status}
                              </span>
                            )
                          })()}
                        </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.timestamp || order.created_at)} at {formatTime(order.timestamp || order.created_at)} • {Array.isArray(order.items) ? order.items.length : Object.keys(order.items || {}).length} item{(Array.isArray(order.items) ? order.items.length : Object.keys(order.items || {}).length) !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">₹{order.total || order.order_amount}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden relative">
            {/* Close Button */}
            <button
              onClick={handleCloseReceipt}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Receipt Content */}
            <div className="overflow-y-auto max-h-[90vh]">
              <ReceiptModal 
                order={normalizeOrderForReceipt(selectedOrder)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderHistory 