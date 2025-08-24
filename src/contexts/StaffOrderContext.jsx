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
  const [completedOrders, setCompletedOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
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
          const completed = orders.filter(order => order.status === ORDER_STATUS.COMPLETED);
          const rejected = orders.filter(order => order.status === ORDER_STATUS.REJECTED);
          
          console.log('StaffOrderProvider: Filtered orders:', {
            pending: pending.length,
            accepted: accepted.length,
            completed: completed.length,
            rejected: rejected.length
          });
          
          setPendingOrders(pending);
          setAcceptedOrders(accepted);
          setCompletedOrders(completed);
          setRejectedOrders(rejected);
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
      
      // Refresh all orders when any change occurs
      // This is simpler and more reliable than trying to sync individual changes
      const refreshOrders = async () => {
        try {
          const result = await getAllOrders();
          if (result.success) {
            const orders = result.orders || [];
            
            // Filter orders by status
            const pending = orders.filter(order => order.status === ORDER_STATUS.PENDING);
            const accepted = orders.filter(order => order.status === ORDER_STATUS.ACCEPTED);
            const completed = orders.filter(order => order.status === ORDER_STATUS.COMPLETED);
            const rejected = orders.filter(order => order.status === ORDER_STATUS.REJECTED);
            
            setPendingOrders(pending);
            setAcceptedOrders(accepted);
            setCompletedOrders(completed);
            setRejectedOrders(rejected);
          }
        } catch (error) {
          console.error('StaffOrderProvider: Error refreshing orders:', error);
        }
      };
      
      refreshOrders();
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

  // Reject order (payment not confirmed)
  const rejectOrder = async (orderId) => {
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.REJECTED);
      return result;
    } catch (error) {
      console.error('Error rejecting order:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete order (permanently remove from rejected orders)
  const deleteOrder = async (orderId) => {
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
      return result;
    } catch (error) {
      console.error('Error deleting order:', error);
      return { success: false, error: error.message };
    }
  };

  // Get order counts
  const getOrderCounts = () => {
    return {
      pending: pendingOrders.length,
      accepted: acceptedOrders.length,
      completed: completedOrders.length,
      rejected: rejectedOrders.length,
      total: pendingOrders.length + acceptedOrders.length
    };
  };

  const value = {
    pendingOrders,
    acceptedOrders,
    completedOrders,
    rejectedOrders,
    loading,
    error,
    acceptOrder,
    completeOrder,
    rejectOrder,
    deleteOrder,
    getOrderCounts
  };

  return (
    <StaffOrderContext.Provider value={value}>
      {children}
    </StaffOrderContext.Provider>
  );
};
