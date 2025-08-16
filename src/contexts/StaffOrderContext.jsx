import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAllOrders, 
  updateOrderStatus, 
  subscribeToOrders,
  ORDER_STATUS 
} from '../services/supabaseService';

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

  // Load initial orders
  useEffect(() => {
    console.log('StaffOrderProvider: Loading initial orders from Supabase');
    
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getAllOrders();
        console.log('StaffOrderProvider: Initial orders loaded:', result);
        
        if (result.success) {
          const orders = result.orders || [];
          
          // Filter orders by status
          const pending = orders.filter(order => order.status === ORDER_STATUS.PENDING);
          const accepted = orders.filter(order => order.status === ORDER_STATUS.ACCEPTED);
          const ready = orders.filter(order => order.status === ORDER_STATUS.READY);
          
          console.log('StaffOrderProvider: Filtered orders:', {
            pending: pending.length,
            accepted: accepted.length,
            ready: ready.length
          });
          
          setPendingOrders(pending);
          setAcceptedOrders(accepted);
          setReadyOrders(ready);
        } else {
          console.error('StaffOrderProvider: Failed to load orders:', result.error);
          setError(result.error);
        }
      } catch (error) {
        console.error('StaffOrderProvider: Error loading orders:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Real-time subscription for order updates
  useEffect(() => {
    console.log('StaffOrderProvider: Setting up real-time subscription');
    
    const subscription = subscribeToOrders((payload) => {
      console.log('StaffOrderProvider: Real-time order update received:', payload);
      
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'INSERT') {
        // New order added
        if (newRecord.status === ORDER_STATUS.PENDING) {
          setPendingOrders(prev => [newRecord, ...prev]);
        }
      } else if (eventType === 'UPDATE') {
        // Order status changed
        const orderId = newRecord.id;
        
        // Remove from all lists first
        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        setAcceptedOrders(prev => prev.filter(order => order.id !== orderId));
        setReadyOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Add to appropriate list based on new status
        if (newRecord.status === ORDER_STATUS.PENDING) {
          setPendingOrders(prev => [newRecord, ...prev]);
        } else if (newRecord.status === ORDER_STATUS.ACCEPTED) {
          setAcceptedOrders(prev => [newRecord, ...prev]);
        } else if (newRecord.status === ORDER_STATUS.READY) {
          setReadyOrders(prev => [newRecord, ...prev]);
        }
      } else if (eventType === 'DELETE') {
        // Order deleted
        const orderId = oldRecord.id;
        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        setAcceptedOrders(prev => prev.filter(order => order.id !== orderId));
        setReadyOrders(prev => prev.filter(order => order.id !== orderId));
      }
    });

    return () => {
      console.log('StaffOrderProvider: Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Accept order (confirm payment and start preparation)
  const acceptOrder = async (orderId) => {
    console.log(`StaffOrderContext: acceptOrder called for order ${orderId}`);
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.ACCEPTED);
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
      const result = await updateOrderStatus(orderId, ORDER_STATUS.READY);
      return result;
    } catch (error) {
      console.error('Error marking order as ready:', error);
      return { success: false, error: error.message };
    }
  };

  // Complete order (delivered/picked up)
  const completeOrder = async (orderId) => {
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.COMPLETED);
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
