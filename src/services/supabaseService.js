import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ========================================
// USER OPERATIONS
// ========================================

export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { success: true, user: data }
  } catch (error) {
    console.error('Error getting user:', error)
    return { success: false, error: error.message }
  }
}

export const updateUser = async (userId, updates) => {
  try {
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

// ========================================
// ORDER OPERATIONS
// ========================================

export const createOrder = async (orderData) => {
  try {
    // Start a transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: orderData.user_id,
        order_amount: orderData.order_amount,
        status: 'pending'
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError
    }

    return { success: true, order: order }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: error.message }
  }
}

export const getUserOrders = async (userId) => {
  try {
    // Get orders for the specific user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users (name, emailid)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Get order items for all orders
    const orderIds = orders.map(order => order.id)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)

    if (itemsError) throw itemsError

    // Group items by order_id
    const itemsByOrderId = {}
    orderItems.forEach(item => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = []
      }
      itemsByOrderId[item.order_id].push(item)
    })

    // Transform the data to match the expected format
    const transformedOrders = orders.map(order => ({
      id: order.id,
      status: order.status,
      order_amount: order.order_amount,
      created_at: order.created_at,
      updated_at: order.updated_at,
      user: order.users ? {
        name: order.users.name,
        email: order.users.emailid
      } : null,
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
    // Get orders with user information
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users (name, emailid)
      `)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Get order items for all orders
    const orderIds = orders.map(order => order.id)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)

    if (itemsError) throw itemsError

    // Group items by order_id
    const itemsByOrderId = {}
    orderItems.forEach(item => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = []
      }
      itemsByOrderId[item.order_id].push(item)
    })

    // Transform the data to match the expected format
    const transformedOrders = orders.map(order => ({
      id: order.id,
      status: order.status,
      order_amount: order.order_amount,
      created_at: order.created_at,
      updated_at: order.updated_at,
      user: order.users ? {
        name: order.users.name,
        email: order.users.emailid
      } : null,
      items: itemsByOrderId[order.id] || [],
      timestamp: order.created_at
    }))
    
    return { success: true, orders: transformedOrders }
  } catch (error) {
    console.error('Error getting all orders:', error)
    return { success: false, error: error.message }
  }
}

export const updateOrderStatus = async (orderId, status) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
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
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users (name, emailid),
        order_items (*)
      `)
      .eq('id', orderId)
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
  return supabase
    .channel('orders')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('Order change:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

export const subscribeToUserOrders = (userId, callback) => {
  return supabase
    .channel(`user_orders_${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('User order change:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

export const subscribeToOrderItems = (callback) => {
  return supabase
    .channel('order_items')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'order_items' },
      (payload) => {
        console.log('Order item change:', payload)
        callback(payload)
      }
    )
    .subscribe()
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
  READY: 'ready',
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

