import { createContext, useContext, useState, useEffect } from 'react';
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

  // Load initial orders
  useEffect(() => {
    console.log('StaffOrderProvider: Loading initial orders from Supabase');
    
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Clear any cached data first
        console.log('StaffOrderProvider: Clearing any cached order data');
        setPendingOrders([]);
        setAcceptedOrders([]);
        setCompletedOrders([]);
        setCancelledOrders([]);
        
        // No longer using localStorage for orders - Supabase is the single source of truth
        console.log('StaffOrderProvider: Using Supabase as single source of truth');
        
        const result = await getAllOrders();
        console.log('StaffOrderProvider: Initial orders loaded:', result);
        console.log('StaffOrderProvider: Current timestamp:', new Date().toISOString());
        
        if (result.success) {
          const orders = result.orders || [];
          console.log('StaffOrderProvider: Raw orders from database:', orders);
          console.log('StaffOrderProvider: Total orders found:', orders.length);
          
          // Additional validation: ensure orders have valid database IDs
          const validOrders = orders.filter(order => {
            const isValid = order.supabase_id && order.id && order.created_at;
            if (!isValid) {
              console.warn('StaffOrderProvider: Invalid order filtered out:', order);
            }
            return isValid;
          });
          
          console.log('StaffOrderProvider: Valid orders after filtering:', validOrders.length);
          
          // Filter orders by status using validated orders
          const pending = validOrders.filter(order => order.status === ORDER_STATUS.PENDING);
          const accepted = validOrders.filter(order => order.status === ORDER_STATUS.ACCEPTED);
          const completed = validOrders.filter(order => order.status === ORDER_STATUS.COMPLETED);
          const cancelled = validOrders.filter(order => order.status === ORDER_STATUS.CANCELLED);
          
          console.log('StaffOrderProvider: Filtered orders from database:', {
            pending: pending.length,
            accepted: accepted.length,
            completed: completed.length,
            cancelled: cancelled.length,
            totalOrders: orders.length
          });
          
          // Only set orders if we have real data from database
          if (validOrders.length > 0) {
            setPendingOrders(pending);
            setAcceptedOrders(accepted);
            setCompletedOrders(completed);
            setCancelledOrders(cancelled);
            console.log('StaffOrderProvider: Orders set successfully from database');
          } else {
            console.log('StaffOrderProvider: No valid orders found in database, keeping empty arrays');
          }
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
        console.log('StaffOrderProvider: Refreshing orders after real-time update');
        
        // Add a small delay to ensure database operations are complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const result = await getAllOrders();
          if (result.success) {
            const orders = result.orders || [];
            
            // Filter orders by status
            const pending = orders.filter(order => order.status === ORDER_STATUS.PENDING);
            const accepted = orders.filter(order => order.status === ORDER_STATUS.ACCEPTED);
            const completed = orders.filter(order => order.status === ORDER_STATUS.COMPLETED);
            const cancelled = orders.filter(order => order.status === ORDER_STATUS.CANCELLED);
            
            console.log('StaffOrderProvider: Updated order counts:', {
              pending: pending.length,
              accepted: accepted.length,
              completed: completed.length,
              cancelled: cancelled.length
            });
            
            // Check for new orders (compare with previous pending count)
            const previousPendingCount = pendingOrders.length;
            const newPendingCount = pending.length;
            
            if (newPendingCount > previousPendingCount) {
              // New order detected - find the new order(s)
              const newOrders = pending.filter(order => 
                !pendingOrders.some(prevOrder => prevOrder.id === order.id)
              );
              
              // Notify for each new order
              newOrders.forEach(order => {
                const orderId = order.id || order.custom_order_id || 'Unknown';
                const customerName = order.user?.name || order.user?.email || 'Unknown Customer';
                notificationService.notifyNewOrder(orderId, customerName);
              });
            }
            
            setPendingOrders(pending);
            setAcceptedOrders(accepted);
            setCompletedOrders(completed);
            setCancelledOrders(cancelled);
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

  // Cancel order (payment not confirmed or order rejected)
  const cancelOrder = async (orderId) => {
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
      return result;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete order (permanently remove from cancelled orders)
  const deleteOrder = async (orderId) => {
    console.log(`StaffOrderContext: deleteOrder called for order ${orderId}`);
    console.log(`StaffOrderContext: orderId type: ${typeof orderId}, value: ${orderId}`);
    console.log(`StaffOrderContext: Current cancelled orders before deletion:`, cancelledOrders.length);
    
    try {
      const result = await deleteOrderFromDB(orderId);
      console.log(`StaffOrderContext: deleteOrder result:`, result);
      
      if (result.success) {
        console.log(`StaffOrderContext: Deleting order ${orderId} from state arrays`);
        
        // Remove the order from all state arrays
        setPendingOrders(prev => {
          const filtered = prev.filter(order => order.id !== orderId && order.supabase_id !== orderId);
          console.log(`StaffOrderContext: Pending orders after filter: ${filtered.length}`);
          return filtered;
        });
        
        setAcceptedOrders(prev => {
          const filtered = prev.filter(order => order.id !== orderId && order.supabase_id !== orderId);
          console.log(`StaffOrderContext: Accepted orders after filter: ${filtered.length}`);
          return filtered;
        });
        
        setCompletedOrders(prev => {
          const filtered = prev.filter(order => order.id !== orderId && order.supabase_id !== orderId);
          console.log(`StaffOrderContext: Completed orders after filter: ${filtered.length}`);
          return filtered;
        });
        
        setCancelledOrders(prev => {
          const filtered = prev.filter(order => order.id !== orderId && order.supabase_id !== orderId);
          console.log(`StaffOrderContext: Cancelled orders after filter: ${filtered.length}`);
          return filtered;
        });
        
        console.log(`StaffOrderContext: Order ${orderId} removed from all state arrays`);
        
        // Force a manual refresh after deletion to ensure UI is accurate
        // Use a longer delay to account for database replication
        setTimeout(async () => {
          console.log(`StaffOrderContext: Performing manual refresh after deletion of order ${orderId}`);
          try {
            const refreshResult = await getAllOrders();
            if (refreshResult.success) {
              const orders = refreshResult.orders || [];
              const pending = orders.filter(order => order.status === ORDER_STATUS.PENDING);
              const accepted = orders.filter(order => order.status === ORDER_STATUS.ACCEPTED);
              const completed = orders.filter(order => order.status === ORDER_STATUS.COMPLETED);
              const cancelled = orders.filter(order => order.status === ORDER_STATUS.CANCELLED);
              
              console.log(`StaffOrderContext: Manual refresh results:`, {
                pending: pending.length,
                accepted: accepted.length,
                completed: completed.length,
                cancelled: cancelled.length
              });
              
              setPendingOrders(pending);
              setAcceptedOrders(accepted);
              setCompletedOrders(completed);
              setCancelledOrders(cancelled);
              
              // Check if the deleted order still exists
              const stillExists = orders.some(order => {
                // Check both possible ID formats
                return order.id === orderId || 
                       order.supabase_id === orderId ||
                       order.custom_order_id === orderId;
              });
              
              if (stillExists) {
                const matchingOrder = orders.find(order => 
                  order.id === orderId || order.supabase_id === orderId || order.custom_order_id === orderId
                );
                
                console.warn(`StaffOrderContext: Order ${orderId} still exists in database after deletion!`);
                console.warn('StaffOrderContext: Found matching order:', matchingOrder);
                console.warn('StaffOrderContext: Order details:', {
                  searchingFor: orderId,
                  foundOrderId: matchingOrder?.id,
                  foundSupabaseId: matchingOrder?.supabase_id,
                  foundCustomOrderId: matchingOrder?.custom_order_id,
                  foundStatus: matchingOrder?.status
                });
                
                // Only retry deletion if the order is actually the same one we're trying to delete
                if (matchingOrder && (matchingOrder.id === orderId || matchingOrder.supabase_id === orderId)) {
                  console.log(`StaffOrderContext: Attempting to delete order ${orderId} again...`);
                  try {
                    const retryResult = await deleteOrderFromDB(orderId);
                    if (retryResult.success) {
                      console.log(`StaffOrderContext: Successfully deleted order ${orderId} on retry`);
                    } else {
                      console.error(`StaffOrderContext: Failed to delete order ${orderId} on retry:`, retryResult.error);
                    }
                  } catch (retryError) {
                    console.error(`StaffOrderContext: Error retrying deletion of order ${orderId}:`, retryError);
                  }
                } else {
                  console.log(`StaffOrderContext: Found order with similar ID but different details - likely a different order`);
                }
              } else {
                console.log(`StaffOrderContext: Order ${orderId} successfully deleted from database`);
              }
            }
          } catch (error) {
            console.error('StaffOrderContext: Error in manual refresh after deletion:', error);
          }
        }, 3000); // Increased from 2000ms to 3000ms
      }
      
      return result;
    } catch (error) {
      console.error('StaffOrderContext: Error deleting order:', error);
      return { success: false, error: error.message };
    }
  };

  // Move order from completed to pending
  const moveToPending = async (orderId) => {
    console.log('StaffOrderContext: moveToPending called for order:', orderId);
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.PENDING);
      console.log('StaffOrderContext: moveToPending result:', result);
      return result;
    } catch (error) {
      console.error('Error moving order to pending:', error);
      return { success: false, error: error.message };
    }
  };

  // Move order from completed to accepted
  const moveToAccepted = async (orderId) => {
    console.log('StaffOrderContext: moveToAccepted called for order:', orderId);
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.ACCEPTED);
      console.log('StaffOrderContext: moveToAccepted result:', result);
      return result;
    } catch (error) {
      console.error('Error moving order to accepted:', error);
      return { success: false, error: error.message };
    }
  };

  // Move order from completed to cancelled
  const moveToCancelled = async (orderId) => {
    console.log('StaffOrderContext: moveToCancelled called for order:', orderId);
    try {
      const result = await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
      console.log('StaffOrderContext: moveToCancelled result:', result);
      return result;
    } catch (error) {
      console.error('Error moving order to cancelled:', error);
      return { success: false, error: error.message };
    }
  };

  // Get order counts
  const getOrderCounts = () => {
    return {
      pending: pendingOrders.length,
      accepted: acceptedOrders.length,
      completed: completedOrders.length,
      cancelled: cancelledOrders.length,
      total: pendingOrders.length + acceptedOrders.length
    };
  };

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
