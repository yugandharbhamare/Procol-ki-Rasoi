/**
 * Optimized Order Context
 * Provides optimized order management with caching and better performance
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { optimizedOrderService, optimizedUserService, apiCache } from '../services/optimizedSupabaseService';
import notificationService from '../services/notificationService';

const OptimizedOrderContext = createContext();

export const useOptimizedOrders = () => {
  const context = useContext(OptimizedOrderContext);
  if (!context) {
    throw new Error('useOptimizedOrders must be used within an OptimizedOrderProvider');
  }
  return context;
};

export const OptimizedOrderProvider = ({ children }) => {
  const [processingOrders, setProcessingOrders] = useState(new Set());
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(true);

  /**
   * Add completed order with optimized processing
   */
  const addCompletedOrder = useCallback(async (order) => {
    console.log('OptimizedOrderContext: addCompletedOrder called with:', order);
    
    // Check if order is already being processed
    if (processingOrders.has(order.id)) {
      console.log('OptimizedOrderContext: Order already being processed:', order.id);
      return;
    }

    // Add to processing set
    setProcessingOrders(prev => new Set(prev).add(order.id));

    try {
      // Get user info from the order
      const user = order.user || {};
      const userEmail = user.email || 'unknown@email.com';
      
      console.log('OptimizedOrderContext: Getting Supabase user ID for email:', userEmail);
      
      // Get or create user with optimized service
      const userResult = await optimizedUserService.getUserByEmail(userEmail);
      let supabaseUserId = null;
      
      if (userResult.success && userResult.user) {
        supabaseUserId = userResult.user.id;
        console.log('OptimizedOrderContext: Found existing user:', userResult.user.id);
      } else {
        console.log('OptimizedOrderContext: Creating new user for email:', userEmail);
        
        // Create user with optimized upsert
        const createUserResult = await optimizedUserService.upsertUser({
          name: user.displayName || 'Unknown User',
          emailid: userEmail,
          firebase_uid: user.uid || null,
          photo_url: user.photoURL || null
        });
        
        if (createUserResult.success) {
          supabaseUserId = createUserResult.user.id;
          console.log('OptimizedOrderContext: Created new user:', supabaseUserId);
        } else {
          throw new Error(`Failed to create user: ${createUserResult.error}`);
        }
      }

      // Create order with optimized service
      const orderData = {
        user_id: supabaseUserId,
        custom_order_id: order.id,
        status: 'pending',
        order_amount: order.total || 0,
        notes: order.notes || null,
        items: order.items || []
      };

      console.log('OptimizedOrderContext: Creating order with data:', orderData);
      
      const createResult = await optimizedOrderService.createOrder(orderData);
      
      if (createResult.success) {
        console.log('OptimizedOrderContext: Order created successfully:', createResult.order);
        
        // Trigger notification for new order
        notificationService.notifyNewOrder(
          createResult.order.custom_order_id,
          user.displayName || 'Customer'
        );
        
        return createResult.order;
      } else {
        throw new Error(`Failed to create order: ${createResult.error}`);
      }

    } catch (error) {
      console.error('OptimizedOrderContext: Error in addCompletedOrder:', error);
      throw error;
    } finally {
      // Remove from processing set
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  }, [processingOrders]);

  /**
   * Get user orders with caching
   */
  const getUserOrders = useCallback(async (userId, limit = 50, offset = 0) => {
    try {
      console.log('OptimizedOrderContext: Getting user orders for:', userId);
      return await optimizedOrderService.getUserOrders(userId, limit, offset);
    } catch (error) {
      console.error('OptimizedOrderContext: Error getting user orders:', error);
      return { success: false, error: error.message, orders: [] };
    }
  }, []);

  /**
   * Subscribe to order updates with optimized real-time handling
   */
  const subscribeToOrderUpdates = useCallback((userId, onUpdate) => {
    // This would integrate with Supabase real-time subscriptions
    // For now, we'll use polling with caching to reduce API calls
    let pollInterval;
    
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        try {
          const result = await getUserOrders(userId, 50, 0);
          if (result.success && onUpdate) {
            onUpdate(result.orders);
          }
        } catch (error) {
          console.error('OptimizedOrderContext: Error polling orders:', error);
        }
      }, 10000); // Poll every 10 seconds instead of constant real-time
    };

    startPolling();

    // Return cleanup function
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [getUserOrders]);

  /**
   * Clear cache when needed
   */
  const clearCache = useCallback((pattern = null) => {
    if (pattern) {
      apiCache.clearPattern(pattern);
    } else {
      apiCache.clear();
    }
    console.log('OptimizedOrderContext: Cache cleared');
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return apiCache.getStats();
  }, []);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo(() => ({
    addCompletedOrder,
    getUserOrders,
    subscribeToOrderUpdates,
    clearCache,
    getCacheStats,
    processingOrders: Array.from(processingOrders),
    isSupabaseAvailable
  }), [
    addCompletedOrder,
    getUserOrders,
    subscribeToOrderUpdates,
    clearCache,
    getCacheStats,
    processingOrders,
    isSupabaseAvailable
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('OptimizedOrderContext: Cleaning up');
    };
  }, []);

  return (
    <OptimizedOrderContext.Provider value={contextValue}>
      {children}
    </OptimizedOrderContext.Provider>
  );
};

export default OptimizedOrderContext;
