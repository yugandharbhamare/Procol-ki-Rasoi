import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  getAllOrders,
  updateOrderStatus,
  subscribeToOrders,
  deleteOrder as deleteOrderFromDB,
  ORDER_STATUS
} from '../services/supabaseService';
import notificationService from '../services/notificationService';

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
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref to track current pending orders for the subscription closure
  const pendingOrdersRef = useRef(pendingOrders);

  // Keep ref in sync with state
  useEffect(() => {
    pendingOrdersRef.current = pendingOrders;
  }, [pendingOrders]);

  // Helper to categorize orders by status
  const categorizeOrders = (orders) => {
    const pending = orders.filter(order => order.status === ORDER_STATUS.PENDING);
    const accepted = orders.filter(order => order.status === ORDER_STATUS.ACCEPTED);
    const completed = orders.filter(order => order.status === ORDER_STATUS.COMPLETED);
    const cancelled = orders.filter(order => order.status === ORDER_STATUS.CANCELLED);
    return { pending, accepted, completed, cancelled };
  };

  const applyOrderCategories = ({ pending, accepted, completed, cancelled }) => {
    setPendingOrders(pending);
    setAcceptedOrders(accepted);
    setCompletedOrders(completed);
    setCancelledOrders(cancelled);
  };

  // Load initial orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Clear cached data
        setPendingOrders([]);
        setAcceptedOrders([]);
        setCompletedOrders([]);
        setCancelledOrders([]);

        const result = await getAllOrders();

        if (result.success) {
          const orders = result.orders || [];

          // Validate orders have required database IDs
          const validOrders = orders.filter(order =>
            order.supabase_id && order.id && order.created_at
          );

          if (validOrders.length > 0) {
            applyOrderCategories(categorizeOrders(validOrders));
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('StaffOrderProvider: Error loading orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Real-time subscription for order updates
  useEffect(() => {
    const subscription = subscribeToOrders((payload) => {
      try {
        const refreshOrders = async () => {
          // Small delay to ensure database operations are complete
          await new Promise(resolve => setTimeout(resolve, 500));

          try {
            const result = await getAllOrders();
            if (result.success) {
              const orders = result.orders || [];
              const { pending, accepted, completed, cancelled } = categorizeOrders(orders);

              // Check for new orders using ref (not stale closure)
              const previousPendingCount = pendingOrdersRef.current.length;
              if (pending.length > previousPendingCount) {
                const newOrders = pending.filter(order =>
                  !pendingOrdersRef.current.some(prevOrder => prevOrder.id === order.id)
                );

                newOrders.forEach(order => {
                  const orderId = order.id || order.custom_order_id || 'Unknown';
                  const customerName = order.user?.name || order.user?.email || 'Unknown Customer';
                  notificationService.notifyNewOrder(orderId, customerName);
                });
              }

              applyOrderCategories({ pending, accepted, completed, cancelled });
            }
          } catch (err) {
            console.error('StaffOrderProvider: Error refreshing orders:', err);
          }
        };

        refreshOrders();
      } catch (err) {
        console.error('StaffOrderProvider: Error in subscription callback:', err);
      }
    });

    if (!subscription) {
      console.error('StaffOrderProvider: Failed to create subscription');
      return;
    }

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Accept order (confirm payment and start preparation)
  const acceptOrder = async (orderId) => {
    try {
      return await updateOrderStatus(orderId, ORDER_STATUS.ACCEPTED);
    } catch (error) {
      console.error('Error accepting order:', error);
      return { success: false, error: error.message };
    }
  };

  // Complete order (delivered/picked up)
  const completeOrder = async (orderId) => {
    try {
      return await updateOrderStatus(orderId, ORDER_STATUS.COMPLETED);
    } catch (error) {
      console.error('Error completing order:', error);
      return { success: false, error: error.message };
    }
  };

  // Cancel order (payment not confirmed or order rejected)
  const cancelOrder = async (orderId) => {
    try {
      return await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete order (permanently remove)
  const deleteOrder = async (orderId) => {
    try {
      const result = await deleteOrderFromDB(orderId);

      if (result.success) {
        // Remove from all state arrays
        const filterOut = (prev) =>
          prev.filter(order => order.id !== orderId && order.supabase_id !== orderId);

        setPendingOrders(filterOut);
        setAcceptedOrders(filterOut);
        setCompletedOrders(filterOut);
        setCancelledOrders(filterOut);

        // Refresh from DB after a delay to ensure consistency
        setTimeout(async () => {
          try {
            const refreshResult = await getAllOrders();
            if (refreshResult.success) {
              applyOrderCategories(categorizeOrders(refreshResult.orders || []));

              // Retry deletion if order still exists
              const stillExists = (refreshResult.orders || []).some(order =>
                order.id === orderId || order.supabase_id === orderId
              );
              if (stillExists) {
                await deleteOrderFromDB(orderId);
              }
            }
          } catch (err) {
            console.error('Error in post-deletion refresh:', err);
          }
        }, 3000);
      }

      return result;
    } catch (error) {
      console.error('Error deleting order:', error);
      return { success: false, error: error.message };
    }
  };

  // Move order from completed to pending
  const moveToPending = async (orderId) => {
    try {
      return await updateOrderStatus(orderId, ORDER_STATUS.PENDING);
    } catch (error) {
      console.error('Error moving order to pending:', error);
      return { success: false, error: error.message };
    }
  };

  // Move order from completed to accepted
  const moveToAccepted = async (orderId) => {
    try {
      return await updateOrderStatus(orderId, ORDER_STATUS.ACCEPTED);
    } catch (error) {
      console.error('Error moving order to accepted:', error);
      return { success: false, error: error.message };
    }
  };

  // Move order from completed to cancelled
  const moveToCancelled = async (orderId) => {
    try {
      return await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
    } catch (error) {
      console.error('Error moving order to cancelled:', error);
      return { success: false, error: error.message };
    }
  };

  // Get order counts
  const getOrderCounts = () => ({
    pending: pendingOrders.length,
    accepted: acceptedOrders.length,
    completed: completedOrders.length,
    cancelled: cancelledOrders.length,
    total: pendingOrders.length + acceptedOrders.length
  });

  const value = {
    pendingOrders,
    acceptedOrders,
    completedOrders,
    cancelledOrders,
    loading,
    error,
    acceptOrder,
    completeOrder,
    cancelOrder,
    deleteOrder,
    moveToPending,
    moveToAccepted,
    moveToCancelled,
    getOrderCounts
  };

  return (
    <StaffOrderContext.Provider value={value}>
      {children}
    </StaffOrderContext.Provider>
  );
};
