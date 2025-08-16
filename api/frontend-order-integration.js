// Frontend integration example for Order Management API
// This can be used in your React components

const API_BASE_URL = 'http://localhost:3001';

/**
 * Create a new order after payment confirmation
 * @param {Object} orderData - Order data including items, user info, and payment details
 * @returns {Promise<Object>} - Created order result
 */
export async function createOrder(orderData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Accept an order (move from pending to accepted)
 * @param {string} orderId - Order ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Accept result
 */
export async function acceptOrder(orderId, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management/${orderId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acceptedBy: options.acceptedBy || 'staff',
        notes: options.notes || ''
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error accepting order:', error);
    throw error;
  }
}

/**
 * Mark order as ready (move from accepted to ready)
 * @param {string} orderId - Order ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Ready result
 */
export async function markOrderAsReady(orderId, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management/${orderId}/ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markedReadyBy: options.markedReadyBy || 'staff',
        notes: options.notes || ''
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error marking order as ready:', error);
    throw error;
  }
}

/**
 * Complete order (move from ready to completed)
 * @param {string} orderId - Order ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Complete result
 */
export async function completeOrder(orderId, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management/${orderId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        completedBy: options.completedBy || 'staff',
        notes: options.notes || ''
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error completing order:', error);
    throw error;
  }
}

/**
 * Cancel order (move to cancelled)
 * @param {string} orderId - Order ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Cancel result
 */
export async function cancelOrder(orderId, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancellationReason: options.cancellationReason || 'Payment failed',
        cancelledBy: options.cancelledBy || 'staff'
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}

/**
 * Get orders by status
 * @param {string} status - Order status
 * @param {number} limit - Maximum number of orders
 * @returns {Promise<Object>} - Orders result
 */
export async function getOrdersByStatus(status, limit = 50) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management/status/${status}?limit=${limit}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error getting orders by status:', error);
    throw error;
  }
}

/**
 * Get all orders with counts
 * @returns {Promise<Object>} - All orders result
 */
export async function getAllOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Order result
 */
export async function getOrderById(orderId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management/${orderId}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw error;
  }
}

/**
 * Update order status (generic)
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data
 * @returns {Promise<Object>} - Update result
 */
export async function updateOrderStatus(orderId, status, additionalData = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order-management/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        additionalData
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Example React component for order management
/*
import React, { useState, useEffect } from 'react';
import { 
  createOrder, 
  acceptOrder, 
  markOrderAsReady, 
  completeOrder, 
  cancelOrder,
  getAllOrders 
} from './frontend-order-integration';

function OrderManagementDashboard() {
  const [orders, setOrders] = useState({});
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await getAllOrders();
      setOrders(result.ordersByStatus);
      setCounts(result.counts);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrder(orderId, { acceptedBy: 'current_staff' });
      await loadOrders(); // Refresh orders
    } catch (error) {
      alert('Error accepting order: ' + error.message);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      await markOrderAsReady(orderId, { markedReadyBy: 'current_staff' });
      await loadOrders(); // Refresh orders
    } catch (error) {
      alert('Error marking order as ready: ' + error.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await completeOrder(orderId, { completedBy: 'current_staff' });
      await loadOrders(); // Refresh orders
    } catch (error) {
      alert('Error completing order: ' + error.message);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await cancelOrder(orderId, { 
        cancellationReason: reason,
        cancelledBy: 'current_staff' 
      });
      await loadOrders(); // Refresh orders
    } catch (error) {
      alert('Error cancelling order: ' + error.message);
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="order-dashboard">
      <h1>Order Management Dashboard</h1>
      
      {/* Order Counts */}
      <div className="order-counts">
        <div className="count-card pending">
          <h3>Pending</h3>
          <span className="count">{counts.pending}</span>
        </div>
        <div className="count-card accepted">
          <h3>In Preparation</h3>
          <span className="count">{counts.accepted}</span>
        </div>
        <div className="count-card ready">
          <h3>Ready</h3>
          <span className="count">{counts.ready}</span>
        </div>
        <div className="count-card completed">
          <h3>Completed</h3>
          <span className="count">{counts.completed}</span>
        </div>
        <div className="count-card cancelled">
          <h3>Cancelled</h3>
          <span className="count">{counts.cancelled}</span>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="order-section">
        <h2>Pending Orders ({counts.pending})</h2>
        {orders.pending?.map(order => (
          <div key={order.id} className="order-card pending">
            <h3>Order #{order.id}</h3>
            <p>Customer: {order.user.displayName}</p>
            <p>Total: ₹{order.total}</p>
            <button onClick={() => handleAcceptOrder(order.id)}>
              Accept Order
            </button>
            <button onClick={() => handleCancelOrder(order.id, 'Staff cancellation')}>
              Cancel Order
            </button>
          </div>
        ))}
      </div>

      {/* Accepted Orders */}
      <div className="order-section">
        <h2>In Preparation ({counts.accepted})</h2>
        {orders.accepted?.map(order => (
          <div key={order.id} className="order-card accepted">
            <h3>Order #{order.id}</h3>
            <p>Customer: {order.user.displayName}</p>
            <p>Total: ₹{order.total}</p>
            <button onClick={() => handleMarkReady(order.id)}>
              Mark as Ready
            </button>
          </div>
        ))}
      </div>

      {/* Ready Orders */}
      <div className="order-section">
        <h2>Ready for Pickup ({counts.ready})</h2>
        {orders.ready?.map(order => (
          <div key={order.id} className="order-card ready">
            <h3>Order #{order.id}</h3>
            <p>Customer: {order.user.displayName}</p>
            <p>Total: ₹{order.total}</p>
            <button onClick={() => handleCompleteOrder(order.id)}>
              Complete Order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderManagementDashboard;
*/

// Example for customer payment flow
/*
import React, { useState } from 'react';
import { createOrder } from './frontend-order-integration';

function PaymentConfirmation({ cartItems, userInfo, paymentDetails }) {
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePaymentConfirmation = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        items: cartItems,
        user: userInfo,
        paymentDetails: paymentDetails,
        notes: 'Order placed via web app'
      };

      const result = await createOrder(orderData);
      setOrderResult(result);
      
      // Show success message
      alert(`Order created successfully! Order ID: ${result.orderId}`);
      
    } catch (error) {
      setError(error.message);
      alert('Error creating order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-confirmation">
      <h2>Payment Confirmation</h2>
      
      {loading && <p>Creating your order...</p>}
      
      {error && <p className="error">Error: {error}</p>}
      
      {orderResult && (
        <div className="order-success">
          <h3>Order Created Successfully!</h3>
          <p>Order ID: {orderResult.orderId}</p>
          <p>Total: ₹{orderResult.order.total}</p>
          <p>Status: {orderResult.order.status}</p>
          <p>Your order is now pending staff approval.</p>
        </div>
      )}
      
      <button 
        onClick={handlePaymentConfirmation}
        disabled={loading}
        className="confirm-payment-btn"
      >
        {loading ? 'Creating Order...' : 'Confirm Payment & Create Order'}
      </button>
    </div>
  );
}

export default PaymentConfirmation;
*/
