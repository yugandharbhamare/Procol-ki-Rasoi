import { useEffect, useRef } from 'react';
import { useOrders } from '../contexts/OrderContext';

/**
 * Hook to monitor order status changes and trigger notifications
 * This hook should be used in the OrderHistory component to monitor
 * order status changes and notify the user
 */
export const useOrderNotifications = (userOrders) => {
  const { notifyOrderStatusChange } = useOrders();
  const previousOrdersRef = useRef([]);

  useEffect(() => {
    if (!userOrders || userOrders.length === 0) {
      previousOrdersRef.current = [];
      return;
    }

    // Compare current orders with previous orders to detect status changes
    const previousOrders = previousOrdersRef.current;
    
    userOrders.forEach(currentOrder => {
      const previousOrder = previousOrders.find(prev => 
        prev.id === currentOrder.id || 
        prev.supabase_id === currentOrder.supabase_id
      );

      if (previousOrder && previousOrder.status !== currentOrder.status) {
        // Status has changed - notify user
        const orderId = currentOrder.id || currentOrder.custom_order_id || 'Unknown';
        let message = '';
        
        switch (currentOrder.status) {
          case 'accepted':
            message = 'Your order has been accepted and is being prepared!';
            break;
          case 'completed':
          case 'ready':
            message = 'Your order is ready for pickup!';
            break;
          case 'cancelled':
            message = 'Your order has been cancelled.';
            break;
          default:
            message = `Your order status has been updated to ${currentOrder.status}`;
        }

        console.log('🔔 Order status change detected:', {
          orderId,
          from: previousOrder.status,
          to: currentOrder.status,
          message
        });

        notifyOrderStatusChange(orderId, currentOrder.status, message);
      }
    });

    // Update the previous orders reference
    previousOrdersRef.current = [...userOrders];
  }, [userOrders, notifyOrderStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previousOrdersRef.current = [];
    };
  }, []);
};
