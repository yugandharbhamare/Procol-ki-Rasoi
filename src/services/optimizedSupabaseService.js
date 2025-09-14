/**
 * Optimized Supabase Service
 * Provides optimized database queries with caching and better performance
 */

import { supabase } from './supabaseService';
import apiCache from './apiCache';

// Optimized query patterns
const QUERY_PATTERNS = {
  // Minimal user data for lists
  USER_MINIMAL: 'id, name, emailid, photo_url, is_staff, is_admin',
  
  // Full user data
  USER_FULL: 'id, name, emailid, photo_url, firebase_uid, is_staff, is_admin, created_at',
  
  // Order with minimal user data
  ORDER_WITH_USER: `
    id,
    user_id,
    custom_order_id,
    status,
    order_amount,
    notes,
    created_at,
    updated_at,
    users!inner(
      id,
      name,
      emailid,
      photo_url
    )
  `,
  
  // Order items with minimal data
  ORDER_ITEMS_MINIMAL: 'id, order_id, item_name, quantity, price, item_amount',
  
  // Menu items minimal
  MENU_ITEMS_MINIMAL: 'id, name, price, image, category, is_available',
  
  // Menu items full
  MENU_ITEMS_FULL: 'id, name, price, description, image, category, is_available, created_at, updated_at'
};

/**
 * Optimized user operations
 */
export const optimizedUserService = {
  /**
   * Get user by email with caching
   */
  async getUserByEmail(email) {
    const cacheKey = `user:email:${email}`;
    
    return apiCache.cachedCall(
      'getUserByEmail',
      { email },
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select(QUERY_PATTERNS.USER_FULL)
          .eq('emailid', email)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return { success: true, user: data };
      },
      apiCache.defaultDurations.user
    );
  },

  /**
   * Create or update user with upsert
   */
  async upsertUser(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert([userData], { 
          onConflict: 'emailid',
          ignoreDuplicates: false 
        })
        .select(QUERY_PATTERNS.USER_FULL)
        .single();

      if (error) throw error;

      // Clear user cache for this email
      apiCache.clearPattern(`user:email:${userData.emailid}`);

      return { success: true, user: data };
    } catch (error) {
      console.error('Error upserting user:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user with cache invalidation
   */
  async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select(QUERY_PATTERNS.USER_FULL)
        .single();

      if (error) throw error;

      // Clear user cache
      apiCache.clearPattern('user:');

      return { success: true, user: data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Optimized order operations
 */
export const optimizedOrderService = {
  /**
   * Get user orders with optimized query and caching
   */
  async getUserOrders(userId, limit = 50, offset = 0) {
    const cacheKey = `orders:user:${userId}:${limit}:${offset}`;
    
    return apiCache.cachedCall(
      'getUserOrders',
      { userId, limit, offset },
      async () => {
        // Get orders with minimal user data
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(QUERY_PATTERNS.ORDER_WITH_USER)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (ordersError) throw ordersError;

        // Get order items for all orders in a single query
        const orderIds = orders?.map(order => order.id) || [];
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(QUERY_PATTERNS.ORDER_ITEMS_MINIMAL)
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Group items by order_id
        const itemsByOrderId = {};
        orderItems?.forEach(item => {
          if (!itemsByOrderId[item.order_id]) {
            itemsByOrderId[item.order_id] = [];
          }
          itemsByOrderId[item.order_id].push({
            ...item,
            item_amount: item.item_amount || (item.price * item.quantity)
          });
        });

        // Transform and deduplicate orders
        const uniqueOrders = [];
        const seenOrders = new Set();
        
        orders?.forEach(order => {
          const orderKey = `${order.user_id}-${order.order_amount}-${new Date(order.created_at).toDateString()}`;
          
          if (!seenOrders.has(orderKey)) {
            seenOrders.add(orderKey);
            uniqueOrders.push({
              id: order.id,
              custom_order_id: order.custom_order_id,
              status: order.status,
              order_amount: order.order_amount,
              notes: order.notes,
              created_at: order.created_at,
              updated_at: order.updated_at,
              user: {
                name: order.users?.name || 'Unknown User',
                email: order.users?.emailid || 'No email',
                photoURL: order.users?.photo_url || null
              },
              items: itemsByOrderId[order.id] || [],
              timestamp: order.created_at
            });
          }
        });

        return { success: true, orders: uniqueOrders };
      },
      apiCache.defaultDurations.orders
    );
  },

  /**
   * Get all orders for staff with pagination and caching
   */
  async getAllOrders(limit = 100, offset = 0, status = null) {
    const cacheKey = `orders:all:${limit}:${offset}:${status || 'all'}`;
    
    return apiCache.cachedCall(
      'getAllOrders',
      { limit, offset, status },
      async () => {
        let query = supabase
          .from('orders')
          .select(QUERY_PATTERNS.ORDER_WITH_USER)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq('status', status);
        }

        const { data: orders, error: ordersError } = await query;
        if (ordersError) throw ordersError;

        // Get order items in batch
        const orderIds = orders?.map(order => order.id) || [];
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(QUERY_PATTERNS.ORDER_ITEMS_MINIMAL)
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Group items by order_id
        const itemsByOrderId = {};
        orderItems?.forEach(item => {
          if (!itemsByOrderId[item.order_id]) {
            itemsByOrderId[item.order_id] = [];
          }
          itemsByOrderId[item.order_id].push({
            ...item,
            item_amount: item.item_amount || (item.price * item.quantity)
          });
        });

        // Transform orders
        const transformedOrders = orders?.map(order => ({
          id: order.id,
          supabase_id: order.id,
          custom_order_id: order.custom_order_id,
          status: order.status,
          order_amount: order.order_amount,
          notes: order.notes,
          created_at: order.created_at,
          updated_at: order.updated_at,
          user: {
            name: order.users?.name || 'Unknown User',
            email: order.users?.emailid || 'No email',
            photoURL: order.users?.photo_url || null
          },
          items: itemsByOrderId[order.id] || [],
          timestamp: order.created_at
        })) || [];

        return { success: true, orders: transformedOrders };
      },
      apiCache.defaultDurations.orders
    );
  },

  /**
   * Create order with optimized data structure
   */
  async createOrder(orderData) {
    try {
      // Start transaction-like operation
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.user_id,
          custom_order_id: orderData.custom_order_id,
          status: orderData.status || 'pending',
          order_amount: orderData.order_amount,
          notes: orderData.notes || null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items in batch
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_amount: item.quantity * item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Clear orders cache
      apiCache.clearPattern('orders:');

      return { success: true, order };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update order status with cache invalidation
   */
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Clear orders cache
      apiCache.clearPattern('orders:');

      return { success: true, order: data };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Optimized menu operations
 */
export const optimizedMenuService = {
  /**
   * Get all menu items with caching
   */
  async getAllMenuItems() {
    return apiCache.cachedCall(
      'getAllMenuItems',
      {},
      async () => {
        const { data, error } = await supabase
          .from('menu_items')
          .select(QUERY_PATTERNS.MENU_ITEMS_FULL)
          .order('name', { ascending: true });

        if (error) throw error;
        return { success: true, menuItems: data || [] };
      },
      apiCache.defaultDurations.menu
    );
  },

  /**
   * Add menu item with cache invalidation
   */
  async addMenuItem(menuItem) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: menuItem.name,
          price: parseFloat(menuItem.price),
          description: menuItem.description || '',
          image: menuItem.image || '',
          category: menuItem.category || 'General',
          is_available: menuItem.is_available !== false
        }])
        .select()
        .single();

      if (error) throw error;

      // Clear menu cache
      apiCache.clearPattern('getAllMenuItems');

      return { success: true, menuItem: data };
    } catch (error) {
      console.error('Error adding menu item:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update menu item with cache invalidation
   */
  async updateMenuItem(id, updates) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Clear menu cache
      apiCache.clearPattern('getAllMenuItems');

      return { success: true, menuItem: data };
    } catch (error) {
      console.error('Error updating menu item:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete menu item with cache invalidation
   */
  async deleteMenuItem(id) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clear menu cache
      apiCache.clearPattern('getAllMenuItems');

      return { success: true };
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Optimized staff operations
 */
export const optimizedStaffService = {
  /**
   * Get all staff members with caching
   */
  async getAllStaff() {
    return apiCache.cachedCall(
      'getAllStaff',
      {},
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select(QUERY_PATTERNS.USER_MINIMAL)
          .or('is_staff.eq.true,is_admin.eq.true')
          .order('name', { ascending: true });

        if (error) throw error;
        return { success: true, staff: data || [] };
      },
      apiCache.defaultDurations.staff
    );
  },

  /**
   * Update staff member with cache invalidation
   */
  async updateStaffMember(id, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select(QUERY_PATTERNS.USER_MINIMAL)
        .single();

      if (error) throw error;

      // Clear staff cache
      apiCache.clearPattern('getAllStaff');

      return { success: true, staff: data };
    } catch (error) {
      console.error('Error updating staff member:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export cache instance for external access
export { apiCache };
