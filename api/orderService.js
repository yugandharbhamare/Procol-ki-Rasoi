const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} = require('firebase/firestore');
const { calculateOrder } = require('./orderCalculator');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Check if Firebase config is properly set up
const missingConfig = Object.entries(firebaseConfig).filter(([key, value]) => !value);
if (missingConfig.length > 0) {
  console.error('Firebase: Missing configuration values:', missingConfig.map(([key]) => key));
  console.error('Firebase: This will prevent the order management API from working properly');
} else {
  console.log('Firebase: All configuration values are present for order management API');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Order status constants
const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Create a new order after payment confirmation
 * @param {Object} orderData - Order data including items, user info, and payment details
 * @returns {Promise<Object>} - Created order with ID and status
 */
async function createOrder(orderData) {
  try {
    const {
      items,
      user,
      paymentDetails,
      notes = '',
      total,
      subtotal,
      tax
    } = orderData;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items array is required and cannot be empty');
    }

    if (!user || !user.email) {
      throw new Error('User information with email is required');
    }

    if (!paymentDetails || !paymentDetails.status) {
      throw new Error('Payment details are required');
    }

    // Calculate order total if not provided
    let calculatedTotal = total;
    let calculatedSubtotal = subtotal;
    let calculatedTax = tax;

    if (!calculatedTotal) {
      const calculation = calculateOrder(items);
      calculatedTotal = calculation.total;
      calculatedSubtotal = calculation.subtotal;
      calculatedTax = calculation.tax;
    }

    // Create order document
    const orderDoc = {
      items: items,
      user: {
        email: user.email,
        displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      },
      total: calculatedTotal,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      status: ORDER_STATUS.PENDING,
      paymentDetails: {
        status: paymentDetails.status,
        method: paymentDetails.method || 'UPI',
        transactionId: paymentDetails.transactionId,
        amount: calculatedTotal,
        timestamp: new Date()
      },
      notes: notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      currency: 'INR'
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'orders'), orderDoc);

    console.log(`Order created successfully with ID: ${docRef.id}`);

    return {
      success: true,
      orderId: docRef.id,
      order: {
        id: docRef.id,
        ...orderDoc
      },
      message: 'Order created successfully and is now pending staff approval'
    };

  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update
 * @returns {Promise<Object>} - Update result
 */
async function updateOrderStatus(orderId, status, additionalData = {}) {
  try {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const orderRef = doc(db, 'orders', orderId);
    
    const updateData = {
      status: status,
      updatedAt: new Date(),
      ...additionalData
    };

    // Add status-specific data
    switch (status) {
      case ORDER_STATUS.ACCEPTED:
        updateData.acceptedAt = new Date();
        updateData.acceptedBy = additionalData.acceptedBy || 'staff';
        break;
      case ORDER_STATUS.READY:
        updateData.readyAt = new Date();
        updateData.markedReadyBy = additionalData.markedReadyBy || 'staff';
        break;
      case ORDER_STATUS.COMPLETED:
        updateData.completedAt = new Date();
        updateData.completedBy = additionalData.completedBy || 'staff';
        break;
      case ORDER_STATUS.CANCELLED:
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = additionalData.cancelledBy || 'staff';
        updateData.cancellationReason = additionalData.cancellationReason || 'Payment failed';
        break;
    }

    await updateDoc(orderRef, updateData);

    console.log(`Order ${orderId} status updated to ${status}`);

    return {
      success: true,
      message: `Order status updated to ${status}`,
      orderId: orderId,
      status: status
    };

  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get orders by status
 * @param {string} status - Order status to filter by
 * @param {number} limit - Maximum number of orders to return
 * @returns {Promise<Array>} - Array of orders
 */
async function getOrdersByStatus(status, limitCount = 50) {
  try {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(ordersQuery);
    const orders = [];

    snapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      orders: orders,
      count: orders.length
    };

  } catch (error) {
    console.error('Error getting orders by status:', error);
    return {
      success: false,
      error: error.message,
      orders: []
    };
  }
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Order data
 */
async function getOrderById(orderId) {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    return {
      success: true,
      order: {
        id: orderDoc.id,
        ...orderDoc.data()
      }
    };

  } catch (error) {
    console.error('Error getting order by ID:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all orders with real-time updates
 * @param {Function} callback - Callback function for real-time updates
 * @returns {Function} - Unsubscribe function
 */
function subscribeToOrders(callback) {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Group orders by status
      const ordersByStatus = {
        pending: orders.filter(order => order.status === ORDER_STATUS.PENDING),
        accepted: orders.filter(order => order.status === ORDER_STATUS.ACCEPTED),
        ready: orders.filter(order => order.status === ORDER_STATUS.READY),
        completed: orders.filter(order => order.status === ORDER_STATUS.COMPLETED),
        cancelled: orders.filter(order => order.status === ORDER_STATUS.CANCELLED)
      };

      callback({
        success: true,
        orders: orders,
        ordersByStatus: ordersByStatus,
        counts: {
          pending: ordersByStatus.pending.length,
          accepted: ordersByStatus.accepted.length,
          ready: ordersByStatus.ready.length,
          completed: ordersByStatus.completed.length,
          cancelled: ordersByStatus.cancelled.length,
          total: orders.length
        }
      });
    }, (error) => {
      console.error('Error in orders subscription:', error);
      callback({
        success: false,
        error: error.message
      });
    });

    return unsubscribe;

  } catch (error) {
    console.error('Error setting up orders subscription:', error);
    callback({
      success: false,
      error: error.message
    });
    return () => {};
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrdersByStatus,
  getOrderById,
  subscribeToOrders,
  ORDER_STATUS
};
