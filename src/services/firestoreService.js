import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Collection names
const COLLECTIONS = {
  ORDERS: 'orders',
  USERS: 'users',
  STAFF: 'staff'
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    console.log('FirestoreService: createOrder called with data:', orderData);
    console.log('FirestoreService: Firestore db object:', db);
    console.log('FirestoreService: Firestore db type:', typeof db);
    console.log('FirestoreService: Firestore db null check:', db === null);
    
    if (!db) {
      console.error('FirestoreService: Firestore db is null - cannot create order');
      throw new Error('Firestore not initialized');
    }

    const orderDoc = {
      ...orderData,
      status: ORDER_STATUS.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('FirestoreService: Prepared order document:', orderDoc);
    console.log('FirestoreService: Attempting to add document to collection:', COLLECTIONS.ORDERS);
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), orderDoc);
    console.log('FirestoreService: Order created successfully with ID:', docRef.id);
    
    return {
      success: true,
      orderId: docRef.id,
      message: 'Order created successfully'
    };
  } catch (error) {
    console.error('FirestoreService: Error creating order:', error);
    console.error('FirestoreService: Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return {
      success: false,
      error: error.message
    };
  }
};

// Get order by ID
export const getOrder = async (orderId) => {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const orderDoc = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    
    if (orderDoc.exists()) {
      return {
        success: true,
        order: { id: orderDoc.id, ...orderDoc.data() }
      };
    } else {
      return {
        success: false,
        error: 'Order not found'
      };
    }
  } catch (error) {
    console.error('Error getting order:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  console.log(`FirestoreService: updateOrderStatus called for order ${orderId} with status ${status}`);
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData
    };

    // Add status-specific timestamps
    switch (status) {
      case ORDER_STATUS.ACCEPTED:
        updateData.acceptedAt = serverTimestamp();
        break;
      case ORDER_STATUS.READY:
        updateData.readyAt = serverTimestamp();
        break;
      case ORDER_STATUS.COMPLETED:
        updateData.completedAt = serverTimestamp();
        break;
      case ORDER_STATUS.CANCELLED:
        updateData.cancelledAt = serverTimestamp();
        break;
    }

    console.log(`FirestoreService: Updating order ${orderId} with data:`, updateData);
    await updateDoc(orderRef, updateData);
    console.log(`FirestoreService: Order ${orderId} status successfully updated to ${status}`);
    
    return {
      success: true,
      message: `Order status updated to ${status}`
    };
  } catch (error) {
    console.error('FirestoreService: Error updating order status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get orders by status
export const getOrdersByStatus = async (status, limitCount = 50) => {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const orders = [];

    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      orders
    };
  } catch (error) {
    console.error('Error getting orders by status:', error);
    return {
      success: false,
      error: error.message,
      orders: []
    };
  }
};

// Get all orders
export const getAllOrders = async (limitCount = 100) => {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const orders = [];

    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      orders
    };
  } catch (error) {
    console.error('Error getting all orders:', error);
    return {
      success: false,
      error: error.message,
      orders: []
    };
  }
};

// Real-time listener for orders by status
export const subscribeToOrdersByStatus = (status, callback) => {
  if (!db) {
    console.error('Firestore not initialized');
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(orders);
  });
};

// Real-time listener for all orders
export const subscribeToAllOrders = (callback) => {
  if (!db) {
    console.error('Firestore not initialized');
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(orders);
  });
};

// Delete order (for cleanup purposes)
export const deleteOrder = async (orderId) => {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    // Note: You might want to implement soft delete instead
    // by updating the status to 'deleted' rather than actually deleting
    await deleteDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    
    return {
      success: true,
      message: 'Order deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
