import { createClient } from '@supabase/supabase-js'
import { isCustomOrderId } from '../utils/orderUtils'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:')
  console.error('❌ VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('❌ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  console.error('❌ Please create a .env file with your Supabase credentials')
  console.error('❌ Order placement will fail until this is fixed')
} else {
  console.log('✅ Supabase environment variables are set:')
  console.log('✅ VITE_SUPABASE_URL:', supabaseUrl)
  console.log('✅ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set (length: ' + supabaseAnonKey.length + ')' : 'Missing')
}

// Create Supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Add global error handlers for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    // Prevent the default behavior (which would log to console)
    event.preventDefault()
  })

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
  })

  // Handle message channel errors specifically
  window.addEventListener('message', (event) => {
    // Ignore messages from extensions or other sources
    if (event.source !== window) {
      return
    }
  }, true)
}

// Helper function to check if Supabase is available
const checkSupabaseAvailability = () => {
  if (!supabase) {
    throw new Error('Supabase is not available. Please check your environment variables.')
  }
}

// ========================================
// USER OPERATIONS
// ========================================

export const createUser = async (userData) => {
  try {
    checkSupabaseAvailability()
    
    const { data, error } = await supabase
      .from('users')
      .upsert([userData], { onConflict: 'emailid' })
      .select()
      .single()

    if (error) throw error
    return { success: true, user: data }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: error.message }
  }
}

export const getUser = async (userId) => {
  try {
    checkSupabaseAvailability()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // If user not found, return success: false but don't throw
      if (error.code === 'PGRST116') {
        return { success: false, user: null, error: 'User not found' }
      }
      throw error
    }
    return { success: true, user: data }
  } catch (error) {
    console.error('Error getting user:', error)
    return { success: false, error: error.message }
  }
}

export const getUserByEmail = async (email) => {
  try {
    checkSupabaseAvailability()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('emailid', email)
      .single()

    if (error) {
      // If user not found, return success: false but don't throw
      if (error.code === 'PGRST116') {
        return { success: false, user: null, error: 'User not found' }
      }
      throw error
    }
    return { success: true, user: data }
  } catch (error) {
    console.error('Error getting user by email:', error)
    return { success: false, error: error.message }
  }
}

export const updateUser = async (userId, updates) => {
  try {
    checkSupabaseAvailability()
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { success: true, user: data }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: error.message }
  }
}

export const getAllUsers = async () => {
  try {
    checkSupabaseAvailability()
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name, emailid, is_staff, is_admin')
      .order('name', { ascending: true })

    if (error) throw error
    return { success: true, users: data || [] }
  } catch (error) {
    console.error('Error fetching all users:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// ORDER OPERATIONS
// ========================================

export const createOrder = async (orderData) => {
  try {
    checkSupabaseAvailability()

    console.log('🔧 supabaseService: Creating order with data:', orderData)

    // Check for exact duplicate orders (same user, same amount, within last 30 seconds)
    // This only prevents accidental double-clicks, not legitimate repeat orders
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

    const { data: recentOrders, error: checkError } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('user_id', orderData.user_id)
      .eq('order_amount', orderData.order_amount)
      .gte('created_at', thirtySecondsAgo)
      .limit(1);

    if (checkError) {
      console.warn('Could not check for duplicates:', checkError);
    } else if (recentOrders && recentOrders.length > 0) {
      console.warn('Duplicate order detected within 30 seconds (likely double-click)');
      return {
        success: false,
        error: 'Duplicate order detected. Please wait a moment before placing another order.',
        duplicateOrder: recentOrders[0]
      };
    }

    // Prepare items array for the RPC call
    const items = (orderData.items || []).map(item => ({
      item_name: item.name || item.item_name,
      quantity: item.quantity,
      price: item.price
    }));

    // Create order + items atomically via RPC (single transaction)
    const { data, error } = await supabase
      .rpc('create_order_with_items', {
        p_user_id: orderData.user_id,
        p_order_amount: orderData.order_amount,
        p_status: orderData.status || 'pending',
        p_notes: orderData.notes || null,
        p_items: items
      });

    if (error) throw error;

    const order = data?.order;
    return { success: true, order }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: error.message }
  }
}

export const getUserOrders = async (userId) => {
  try {
    // Get orders with user info and order items in a single query
    // This avoids the 1000-row limit issue with separate items queries
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users!inner(
          id,
          name,
          emailid,
          photo_url
        ),
        order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Deduplicate orders based on their unique UUID
    const uniqueOrders = [];
    const seenOrderIds = new Set();

    orders.forEach(order => {
      if (!seenOrderIds.has(order.id)) {
        seenOrderIds.add(order.id);
        uniqueOrders.push(order);
      }
    });

    // Transform the data to match the expected format
    const transformedOrders = uniqueOrders.map(order => {
      // Enhance items with calculated fields
      const items = (order.order_items || []).map(item => ({
        ...item,
        name: item.name || item.item_name,
        item_name: item.item_name || item.name,
        item_amount: item.item_amount || (Number(item.price || 0) * Number(item.quantity || 0))
      }));

      return {
        id: order.custom_order_id || order.id,
        supabase_id: order.id,
        status: order.status,
        order_amount: order.order_amount,
        notes: order.notes || null,
        created_at: order.created_at,
        updated_at: order.updated_at,
        user: {
          name: order.users?.name || 'Unknown User',
          email: order.users?.emailid || 'No email',
          photoURL: order.users?.photo_url || null
        },
        items,
        timestamp: order.created_at
      };
    });

    return { success: true, orders: transformedOrders }
  } catch (error) {
    console.error('Error getting user orders:', error)
    return { success: false, error: error.message }
  }
}

export const getAllOrders = async () => {
  try {
    // Get orders with user info and order items in a single nested query
    // This avoids the 1000-row limit issue that occurred with separate RPC/items queries
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users!inner(
          id,
          name,
          emailid,
          photo_url
        ),
        order_items(*)
      `)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Deduplicate orders based on their unique UUID
    const uniqueOrders = [];
    const seenOrderIds = new Set();

    orders.forEach(order => {
      if (!seenOrderIds.has(order.id)) {
        seenOrderIds.add(order.id);
        uniqueOrders.push(order);
      }
    });

    if (uniqueOrders.length === 0) {
      return { success: true, orders: [] };
    }

    // Transform the data to match the expected format
    const transformedOrders = uniqueOrders.map(order => {
      // Enhance items with calculated fields
      const items = (order.order_items || []).map(item => ({
        ...item,
        name: item.name || item.item_name,
        item_name: item.item_name || item.name,
        item_amount: item.item_amount || (Number(item.price || 0) * Number(item.quantity || 0))
      }));

      return {
        id: order.custom_order_id || order.id,
        supabase_id: order.id,
        custom_order_id: order.custom_order_id,
        status: order.status,
        order_amount: order.order_amount,
        notes: order.notes || null,
        created_at: order.created_at,
        updated_at: order.updated_at,
        user: {
          name: order.users?.name || 'Unknown User',
          email: order.users?.emailid || 'No email',
          photoURL: order.users?.photo_url || null
        },
        items,
        timestamp: order.created_at
      };
    });

    return { success: true, orders: transformedOrders }
  } catch (error) {
    console.error('Error getting all orders:', error)
    return { success: false, error: error.message }
  }
}

export const updateOrderStatus = async (orderId, status) => {
  try {
    console.log('updateOrderStatus: Updating order status for ID:', orderId);
    
    // If orderId looks like a custom order ID (starts with ORD), find the Supabase ID
    let supabaseOrderId = orderId;
    if (isCustomOrderId(orderId)) {
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('id')
        .eq('custom_order_id', orderId)
        .single();
      
      if (findError) {
        console.error('updateOrderStatus: Error finding order by custom ID:', findError);
        return { success: false, error: 'Order not found' };
      }
      
      supabaseOrderId = order.id;
      console.log('updateOrderStatus: Found Supabase ID:', supabaseOrderId);
    }
    
    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', supabaseOrderId)
      .select()
      .single()

    if (error) throw error

    return { success: true, order: data }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: error.message }
  }
}

export const getOrderById = async (orderId) => {
  try {
    console.log('getOrderById: Getting order for ID:', orderId);
    
    // If orderId looks like a custom order ID (starts with ORD), find the Supabase ID
    let supabaseOrderId = orderId;
    if (isCustomOrderId(orderId)) {
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('id')
        .eq('custom_order_id', orderId)
        .single();
      
      if (findError) {
        console.error('getOrderById: Error finding order by custom ID:', findError);
        return { success: false, error: 'Order not found' };
      }
      
      supabaseOrderId = order.id;
      console.log('getOrderById: Found Supabase ID:', supabaseOrderId);
    }
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users (name, emailid),
        order_items (*)
      `)
      .eq('id', supabaseOrderId)
      .single()

    if (error) throw error
    return { success: true, order: data }
  } catch (error) {
    console.error('Error getting order:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// REALTIME SUBSCRIPTIONS
// ========================================

export const subscribeToOrders = (callback) => {
  try {
    const channel = supabase
      .channel('orders', {
        config: {
          broadcast: { self: false },
          presence: { key: 'orders' }
        }
      })
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          try {
            console.log('Order change:', payload)
            // Use setTimeout to ensure callback is async and doesn't block
            setTimeout(() => {
              try {
                callback(payload)
              } catch (callbackError) {
                console.error('Error in orders subscription callback:', callbackError)
              }
            }, 0)
          } catch (error) {
            console.error('Error in orders subscription payload handler:', error)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to orders')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to orders channel')
        } else if (status === 'TIMED_OUT') {
          console.error('Subscription to orders timed out')
        } else if (status === 'CLOSED') {
          console.log('Orders subscription closed')
        }
      })
    
    return channel
  } catch (error) {
    console.error('Error creating orders subscription:', error)
    return null
  }
}

export const subscribeToUserOrders = (userId, callback) => {
  try {
    const channel = supabase
      .channel(`user_orders_${userId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: `user_orders_${userId}` }
        }
      })
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          try {
            console.log('User order change:', payload)
            // Use setTimeout to ensure callback is async and doesn't block
            setTimeout(() => {
              try {
                callback(payload)
              } catch (callbackError) {
                console.error('Error in user orders subscription callback:', callbackError)
              }
            }, 0)
          } catch (error) {
            console.error('Error in user orders subscription payload handler:', error)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to user orders')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to user orders channel')
        } else if (status === 'TIMED_OUT') {
          console.error('Subscription to user orders timed out')
        } else if (status === 'CLOSED') {
          console.log('User orders subscription closed')
        }
      })
    
    return channel
  } catch (error) {
    console.error('Error creating user orders subscription:', error)
    return null
  }
}

export const subscribeToOrderItems = (callback) => {
  try {
    const channel = supabase
      .channel('order_items', {
        config: {
          broadcast: { self: false },
          presence: { key: 'order_items' }
        }
      })
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          try {
            console.log('Order item change:', payload)
            // Use setTimeout to ensure callback is async and doesn't block
            setTimeout(() => {
              try {
                callback(payload)
              } catch (callbackError) {
                console.error('Error in order items subscription callback:', callbackError)
              }
            }, 0)
          } catch (error) {
            console.error('Error in order items subscription payload handler:', error)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to order items')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to order items channel')
        } else if (status === 'TIMED_OUT') {
          console.error('Subscription to order items timed out')
        } else if (status === 'CLOSED') {
          console.log('Order items subscription closed')
        }
      })
    
    return channel
  } catch (error) {
    console.error('Error creating order items subscription:', error)
    return null
  }
}

// ========================================
// AUTHENTICATION HELPERS
// ========================================

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { success: true, user }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { success: false, error: error.message }
  }
}

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    return { success: false, error: error.message }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const isStaffMember = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: userData } = await supabase
      .from('users')
      .select('emailid')
      .eq('id', user.id)
      .single()

    if (!userData) return false

    const staffEmails = [
      'admin@procol.in',
      'staff@procol.in',
      'kitchen@procol.in',
      'manager@procol.in'
    ]

    return staffEmails.includes(userData.emailid)
  } catch (error) {
    console.error('Error checking staff status:', error)
    return false
  }
}

// ========================================
// ORDER STATUS CONSTANTS
// ========================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// Create a new order
const orderData = {
  user_id: 'user-uuid',
  order_amount: 150.00,
  items: [
    { name: 'Butter Chicken', quantity: 2, price: 75.00 },
    { name: 'Naan', quantity: 2, price: 20.00 }
  ]
}

const result = await createOrder(orderData)

// Subscribe to realtime updates
const subscription = subscribeToOrders((payload) => {
  console.log('Order updated:', payload)
  // Update your UI here
})

// Get user orders
const { orders } = await getUserOrders('user-uuid')

// Update order status (staff only)
await updateOrderStatus('order-uuid', ORDER_STATUS.ACCEPTED)

// Check if user is staff
const isStaff = await isStaffMember()
*/

// Delete order permanently (staff only)
export const deleteOrder = async (orderId) => {
  try {
    console.log(`supabaseService: Deleting order ${orderId} permanently`);
    console.log(`supabaseService: orderId type: ${typeof orderId}, value: ${orderId}`);
    
    // First, verify the order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, custom_order_id')
      .eq('id', orderId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('supabaseService: Error fetching order for deletion:', fetchError);
      throw fetchError;
    }

    if (!existingOrder) {
      console.log(`supabaseService: Order ${orderId} not found, may already be deleted`);
      return { success: true, message: 'Order not found (may already be deleted)' };
    }

    console.log(`supabaseService: Found order to delete:`, existingOrder);
    
    // First delete order items (due to foreign key constraint)
    console.log(`supabaseService: Deleting order items for order ${orderId}`);
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('supabaseService: Error deleting order items:', itemsError);
      throw itemsError;
    }
    
    console.log(`supabaseService: Successfully deleted order items for order ${orderId}`);

    // Then delete the order
    console.log(`supabaseService: Deleting order ${orderId}`);
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderError) {
      console.error('supabaseService: Error deleting order:', orderError);
      throw orderError;
    }

    console.log(`supabaseService: Order ${orderId} deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error('supabaseService: Error deleting order:', error);
    return { success: false, error: error.message };
  }
};

