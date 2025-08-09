import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateOrderStatus, ORDER_STATUS } from '../services/firestoreService';

const StaffOrderContext = createContext();

const useStaffOrders = () => {
  const context = useContext(StaffOrderContext);
  if (!context) {
    throw new Error('useStaffOrders must be used within a StaffOrderProvider');
  }
  return context;
};

export { useStaffOrders };

export const StaffOrderProvider = ({ children }) => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener for orders
  useEffect(() => {
    console.log('StaffOrderProvider: Initializing real-time listeners');
    console.log('StaffOrderProvider: Firestore db object:', db);
    console.log('StaffOrderProvider: Firestore db type:', typeof db);
    console.log('StaffOrderProvider: Firestore db null check:', db === null);
    
    if (!db) {
      console.error('StaffOrderProvider: Firestore db is null - Firebase not configured properly');
      setLoading(false);
      setError('Firestore not configured - please check Firebase configuration');
      return;
    }

    try {
      // Listen for pending orders (new orders that need payment confirmation)
      const pendingQuery = query(
        collection(db, 'orders'),
        where('status', '==', ORDER_STATUS.PENDING),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      console.log('StaffOrderProvider: Setting up pending orders listener with query:', pendingQuery);
      const pendingUnsubscribe = onSnapshot(pendingQuery, (snapshot) => {
        console.log('StaffOrderProvider: Pending orders update received', snapshot.size, 'orders');
        const orders = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('StaffOrderProvider: Processing pending order:', doc.id, data.status, data);
          orders.push({ 
            id: doc.id, 
            ...data,
            timestamp: data.createdAt?.toDate?.() || data.timestamp || new Date()
          });
        });
        console.log('StaffOrderProvider: Setting pending orders:', orders.map(o => ({ id: o.id, status: o.status })));
        setPendingOrders(orders);
      }, (error) => {
        console.error('StaffOrderProvider: Pending orders listener error', error);
        setError(error.message);
      });

      // Listen for accepted orders (payment confirmed, being prepared)
      const acceptedQuery = query(
        collection(db, 'orders'),
        where('status', '==', ORDER_STATUS.ACCEPTED),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      console.log('StaffOrderProvider: Setting up accepted orders listener');
      const acceptedUnsubscribe = onSnapshot(acceptedQuery, (snapshot) => {
        console.log('StaffOrderProvider: Accepted orders update received', snapshot.size, 'orders');
        const orders = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('StaffOrderProvider: Processing accepted order:', doc.id, data.status, data);
          orders.push({ 
            id: doc.id, 
            ...data,
            timestamp: data.createdAt?.toDate?.() || data.timestamp || new Date()
          });
        });
        console.log('StaffOrderProvider: Setting accepted orders:', orders.map(o => ({ id: o.id, status: o.status })));
        setAcceptedOrders(orders);
      }, (error) => {
        console.error('StaffOrderProvider: Accepted orders listener error', error);
        setError(error.message);
      });

      // Listen for ready orders (prepared, ready for pickup)
      const readyQuery = query(
        collection(db, 'orders'),
        where('status', '==', ORDER_STATUS.READY),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      console.log('StaffOrderProvider: Setting up ready orders listener');
      const readyUnsubscribe = onSnapshot(readyQuery, (snapshot) => {
        console.log('StaffOrderProvider: Ready orders update received', snapshot.size, 'orders');
        const orders = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('StaffOrderProvider: Processing ready order:', doc.id, data);
          orders.push({ 
            id: doc.id, 
            ...data,
            timestamp: data.createdAt?.toDate?.() || data.timestamp || new Date()
          });
        });
        console.log('StaffOrderProvider: Setting ready orders:', orders);
        setReadyOrders(orders);
      }, (error) => {
        console.error('StaffOrderProvider: Ready orders listener error', error);
        setError(error.message);
      });

      setLoading(false);
      setError(null);
      console.log('StaffOrderProvider: All listeners set up successfully');

      return () => {
        console.log('StaffOrderProvider: Cleaning up listeners');
        pendingUnsubscribe();
        acceptedUnsubscribe();
        readyUnsubscribe();
      };
    } catch (error) {
      console.error('StaffOrderProvider: Error setting up listeners', error);
      setError(error.message);
      setLoading(false);
    }
  }, []);

  // Accept order (confirm payment and start preparation)
  const acceptOrder = async (orderId) => {
    console.log(`StaffOrderContext: acceptOrder called for order ${orderId}`);
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.ACCEPTED, {
        acceptedBy: 'staff'
      });
      console.log(`StaffOrderContext: acceptOrder result:`, result);
      return result;
    } catch (error) {
      console.error('StaffOrderContext: Error accepting order:', error);
      return { success: false, error: error.message };
    }
  };

  // Mark order as ready
  const markOrderAsReady = async (orderId) => {
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.READY, {
        markedReadyBy: 'staff'
      });
      return result;
    } catch (error) {
      console.error('Error marking order as ready:', error);
      return { success: false, error: error.message };
    }
  };

  // Complete order (delivered/picked up)
  const completeOrder = async (orderId) => {
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.COMPLETED, {
        completedBy: 'staff'
      });
      return result;
    } catch (error) {
      console.error('Error completing order:', error);
      return { success: false, error: error.message };
    }
  };

  // Get order counts
  const getOrderCounts = () => {
    return {
      pending: pendingOrders.length,
      accepted: acceptedOrders.length,
      ready: readyOrders.length,
      total: pendingOrders.length + acceptedOrders.length + readyOrders.length
    };
  };

  const value = {
    pendingOrders,
    acceptedOrders,
    readyOrders,
    loading,
    error,
    acceptOrder,
    markOrderAsReady,
    completeOrder,
    getOrderCounts
  };

  return (
    <StaffOrderContext.Provider value={value}>
      {children}
    </StaffOrderContext.Provider>
  );
};
