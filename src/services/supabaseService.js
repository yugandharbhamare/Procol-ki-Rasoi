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

    // First, create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: orderData.user_id,
        order_amount: orderData.order_amount,
        status: orderData.status || 'pending',
        notes: orderData.notes || null
        // custom_order_id will be automatically generated by the trigger
      }])
      .select()
      .single()

    if (orderError) {
      console.error('🔧 supabaseService: Order creation error:', orderError)
      throw orderError
    }

    console.log('🔧 supabaseService: Order created successfully:', order)

    // Then, create the order items
    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        item_name: item.name || item.item_name,
        quantity: item.quantity,
        price: item.price
      }))

      console.log('🔧 supabaseService: Creating order items:', orderItems)

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError
      
      console.log('🔧 supabaseService: Order items created successfully')
    }

    return { success: true, order }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: error.message }
  }
}

export const getUserOrders = async (userId) => {
  try {
    // Get orders for the specific user by joining with users table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users!inner(
          id,
          name,
          emailid,
          photo_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Deduplicate orders based on their unique UUID (not amount+date which drops legitimate orders)
    const uniqueOrders = [];
    const seenOrderIds = new Set();

    orders.forEach(order => {
      if (!seenOrderIds.has(order.id)) {
        seenOrderIds.add(order.id);
        uniqueOrders.push(order);
      }
    });

    // Get order items for all unique orders with enhanced data
    const orderIds = uniqueOrders.map(order => order.id)
    
    // Use RPC function for bulk query to avoid URL length limits
    const { data: orderItems, error: itemsError } = await supabase
      .rpc('get_order_items_by_ids', { order_ids: orderIds })

    if (itemsError) throw itemsError

    // Group items by order_id and enhance with calculated data
    const itemsByOrderId = {}
    orderItems.forEach(item => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = []
      }
      
      // Ensure item_amount is calculated if not present
      const enhancedItem = {
        ...item,
        item_amount: item.item_amount || (item.price * item.quantity)
      }
      
      itemsByOrderId[item.order_id].push(enhancedItem)
    })

    // Transform the data to match the expected format
    const transformedOrders = uniqueOrders.map(order => ({
      id: order.custom_order_id || order.id, // Use custom order ID for display, fallback to UUID
      supabase_id: order.id, // Keep the original UUID for internal use
      status: order.status,
      order_amount: order.order_amount,
      notes: order.notes || null, // Include notes field
      created_at: order.created_at,
      updated_at: order.updated_at,
      user: {
        name: order.users?.name || 'Unknown User',
        email: order.users?.emailid || 'No email',
        photoURL: order.users?.photo_url || null
      },
      items: itemsByOrderId[order.id] || [],
      timestamp: order.created_at
    }))
    
    return { success: true, orders: transformedOrders }
  } catch (error) {
    console.error('Error getting user orders:', error)
    return { success: false, error: error.message }
  }
}

export const getAllOrders = async () => {
  try {
    // Get orders with user information by joining with users table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users!inner(
          id,
          name,
          emailid,
          photo_url
        )
      `)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Deduplicate orders based on their unique UUID (not amount+date which drops legitimate orders)
    const uniqueOrders = [];
    const seenOrderIds = new Set();

    orders.forEach(order => {
      if (!seenOrderIds.has(order.id)) {
        seenOrderIds.add(order.id);
        uniqueOrders.push(order);
      }
    });

    // Get order items for all unique orders with enhanced data
    const orderIds = uniqueOrders.map(order => order.id)
    
    console.log('getAllOrders: Fetching items for order IDs:', orderIds.slice(0, 5), '... (total:', orderIds.length, ')');
    
    // If no orders, return early
    if (orderIds.length === 0) {
      console.log('getAllOrders: No orders found, returning empty array');
      return { success: true, orders: [] };
    }
    
    // Use RPC function for bulk query to avoid URL length limits
    const { data: orderItems, error: itemsError } = await supabase
      .rpc('get_order_items_by_ids', { order_ids: orderIds })

    let safeOrderItems = orderItems || [];
    
    // If RPC fails with an error (not just empty result), try fallback query
    if (itemsError) {
      console.error('getAllOrders: Error fetching order items via RPC:', itemsError);
      console.error('getAllOrders: RPC function may not exist or there may be a permissions issue');
      console.log('getAllOrders: Attempting fallback query for order items...');
      
      // Fallback: Query items directly using Supabase (works for smaller datasets)
      try {
        const { data: fallbackItems, error: fallbackError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        
        if (fallbackError) {
          console.error('getAllOrders: Fallback query also failed:', fallbackError);
          safeOrderItems = []; // Use empty array as last resort
        } else if (fallbackItems) {
          console.log('getAllOrders: Fallback query succeeded, found', fallbackItems.length, 'items');
          safeOrderItems = fallbackItems;
        } else {
          console.log('getAllOrders: Fallback query returned null/undefined');
          safeOrderItems = [];
        }
      } catch (fallbackException) {
        console.error('getAllOrders: Exception in fallback query:', fallbackException);
        safeOrderItems = [];
      }
    }
    
    console.log('getAllOrders: Raw order items from RPC:', {
      totalItems: safeOrderItems.length,
      sampleItems: safeOrderItems.slice(0, 2),
      hasItems: safeOrderItems.length > 0,
      orderIdsRequested: orderIds.length,
      orderIdsSample: orderIds.slice(0, 3)
    });

    // Group items by order_id and enhance with calculated data
    // Normalize UUIDs to lowercase for consistent matching
    const itemsByOrderId = {}
    safeOrderItems.forEach(item => {
      // Ensure order_id exists and is valid
      if (!item.order_id) {
        console.warn('getAllOrders: Item missing order_id:', item);
        return;
      }
      
      // Normalize order_id to lowercase string for consistent comparison
      // UUIDs should be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const orderIdKey = String(item.order_id);
      const orderIdKeyLower = orderIdKey.toLowerCase().trim(); // Normalize to lowercase, remove whitespace
      
      // Use lowercase as primary key for consistent matching
      const primaryKey = orderIdKeyLower;
      
      if (!itemsByOrderId[primaryKey]) {
        itemsByOrderId[primaryKey] = []
      }
      
      // Also store under original key if different (for backwards compatibility)
      if (primaryKey !== orderIdKey && !itemsByOrderId[orderIdKey]) {
        itemsByOrderId[orderIdKey] = itemsByOrderId[primaryKey]; // Reference same array
      }
      
      // Ensure item_amount is calculated if not present
      // Also ensure name field is available (map item_name to name if needed)
      const enhancedItem = {
        ...item,
        name: item.name || item.item_name, // Support both field names
        item_name: item.item_name || item.name, // Keep both for compatibility
        item_amount: item.item_amount || (Number(item.price || 0) * Number(item.quantity || 0))
      }
      
      itemsByOrderId[primaryKey].push(enhancedItem)
    })

    console.log('getAllOrders: Items grouped by order_id:', {
      totalOrders: uniqueOrders.length,
      totalItems: orderItems?.length || 0,
      itemsByOrderIdKeys: Object.keys(itemsByOrderId),
      itemsByOrderIdCounts: Object.entries(itemsByOrderId).reduce((acc, [key, items]) => {
        acc[key] = items.length;
        return acc;
      }, {})
    });

    // Transform the data to match the expected format
    // First pass: assign items that were found
    const transformedOrders = uniqueOrders.map(order => {
      // Normalize order ID for matching (same normalization as items)
      const orderIdKey = String(order.id);
      const orderIdKeyLower = orderIdKey.toLowerCase().trim(); // Same normalization as items
      
      // Try multiple UUID formats for matching
      let orderItemsArray = itemsByOrderId[orderIdKeyLower] || 
                           itemsByOrderId[orderIdKey] || 
                           itemsByOrderId[order.id] || 
                           [];
      
      if (orderItemsArray.length === 0) {
        console.warn(`getAllOrders: Order ${order.id} (${order.custom_order_id}) has NO items assigned!`, {
          orderId: order.id,
          orderIdString: String(order.id),
          orderIdKeyLower: orderIdKeyLower,
          availableKeys: Object.keys(itemsByOrderId).slice(0, 10),
          itemsByOrderIdCount: Object.keys(itemsByOrderId).length,
          sampleAvailableKey: Object.keys(itemsByOrderId)[0]
        });
      } else {
        console.log(`getAllOrders: Order ${order.id} (${order.custom_order_id}) has ${orderItemsArray.length} items`);
      }
      
      return {
        id: order.custom_order_id || order.id, // Use custom order ID for display, fallback to UUID
        supabase_id: order.id, // Keep the original UUID for internal use
        custom_order_id: order.custom_order_id, // Include custom_order_id explicitly
        status: order.status,
        order_amount: order.order_amount,
        notes: order.notes || null, // Include notes field
        created_at: order.created_at,
        updated_at: order.updated_at,
        user: {
          name: order.users?.name || 'Unknown User',
          email: order.users?.emailid || 'No email',
          photoURL: order.users?.photo_url || null
        },
        items: orderItemsArray,
        timestamp: order.created_at
      };
    });
    
    // Second pass: For orders with no items, try direct query as fallback
    const ordersNeedingItems = transformedOrders.filter(order => !order.items || order.items.length === 0);
    if (ordersNeedingItems.length > 0) {
      console.log(`getAllOrders: ${ordersNeedingItems.length} orders missing items, attempting direct queries...`);
      
      // Query items directly for these orders
      const missingOrderIds = ordersNeedingItems.map(order => order.supabase_id);
      
      try {
        const { data: directItems, error: directError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', missingOrderIds);
        
        if (!directError && directItems && directItems.length > 0) {
          console.log(`getAllOrders: Direct query found ${directItems.length} items for ${missingOrderIds.length} orders`);
          
          // Group direct items by order_id (normalize keys for matching)
          const directItemsByOrderId = {};
          directItems.forEach(item => {
            const orderIdKey = String(item.order_id);
            const orderIdKeyLower = orderIdKey.toLowerCase().trim();
            
            // Store under normalized key
            if (!directItemsByOrderId[orderIdKeyLower]) {
              directItemsByOrderId[orderIdKeyLower] = [];
            }
            
            // Also store under original key for backwards compatibility
            if (orderIdKeyLower !== orderIdKey && !directItemsByOrderId[orderIdKey]) {
              directItemsByOrderId[orderIdKey] = directItemsByOrderId[orderIdKeyLower];
            }
            
            const enhancedItem = {
              ...item,
              name: item.name || item.item_name,
              item_name: item.item_name || item.name,
              item_amount: item.item_amount || (Number(item.price || 0) * Number(item.quantity || 0))
            };
            
            directItemsByOrderId[orderIdKeyLower].push(enhancedItem);
          });
          
          // Update orders with found items
          transformedOrders.forEach(order => {
            if (!order.items || order.items.length === 0) {
              const orderIdKey = String(order.supabase_id);
              const orderIdKeyLower = orderIdKey.toLowerCase().trim();
              
              // Try multiple key formats
              const foundItems = directItemsByOrderId[orderIdKeyLower] || 
                                directItemsByOrderId[orderIdKey] || 
                                directItemsByOrderId[order.supabase_id] || [];
              
              if (foundItems.length > 0) {
                console.log(`getAllOrders: Found ${foundItems.length} items for order ${order.custom_order_id} (${order.supabase_id}) via direct query`);
                order.items = foundItems;
              }
            }
          });
        } else if (directError) {
          console.error('getAllOrders: Direct query for missing items failed:', directError);
        }
      } catch (directException) {
        console.error('getAllOrders: Exception in direct query for missing items:', directException);
      }
    }
    
    console.log('getAllOrders: Returning transformed orders:', {
      totalOrders: transformedOrders.length,
      ordersWithItems: transformedOrders.filter(o => o.items && o.items.length > 0).length,
      ordersWithoutItems: transformedOrders.filter(o => !o.items || o.items.length === 0).length
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

