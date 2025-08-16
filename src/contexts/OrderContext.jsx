import { createContext, useContext, useState, useEffect } from 'react'
import { addOrderToGoogleSheets, syncOrdersFromGoogleSheets } from '../services/googleSheetsService'
import { createOrder } from '../services/supabaseService'

const OrderContext = createContext()

const useOrders = () => {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}

export { useOrders };

export const OrderProvider = ({ children }) => {
  const [completedOrders, setCompletedOrders] = useState([])
  const [supabaseOrderIds, setSupabaseOrderIds] = useState(new Set()) // Track orders created in Supabase

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('completedOrders')
    if (savedOrders) {
      try {
        setCompletedOrders(JSON.parse(savedOrders))
      } catch (error) {
        console.error('Error loading orders from localStorage:', error)
        setCompletedOrders([])
      }
    }
  }, [])

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('completedOrders', JSON.stringify(completedOrders))
  }, [completedOrders])

  const addCompletedOrder = async (order) => {
    console.log('OrderContext: Adding completed order', order);
    
    // Check if order already exists to prevent duplicates
    const existingOrder = completedOrders.find(existing => existing.id === order.id);
    if (existingOrder) {
      console.log('OrderContext: Order already exists, skipping duplicate:', order.id);
      return;
    }
    
    // Only add orders that have been successfully paid
    if (order.paymentDetails && order.paymentDetails.status === 'success') {
      console.log('OrderContext: Payment confirmed, adding order to state and Supabase');
      setCompletedOrders(prev => [order, ...prev])
      
      // Add order to Supabase (only if not already created)
      if (supabaseOrderIds.has(order.id)) {
        console.log('OrderContext: Order already created in Supabase, skipping:', order.id);
        return;
      }
      
      try {
        console.log('OrderContext: Creating order in Supabase...');
        
        // Get current user from localStorage or context
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
        console.log('OrderContext: Current user:', currentUser);
        
        // Get user from Supabase by email to get the correct UUID
        let supabaseUserId = null;
        if (currentUser.email) {
          try {
            const { getUserByEmail } = await import('../services/supabaseService')
            const userResult = await getUserByEmail(currentUser.email)
            if (userResult.success && userResult.user) {
              supabaseUserId = userResult.user.id
              console.log('OrderContext: Found Supabase user ID:', supabaseUserId);
            } else {
              console.warn('OrderContext: User not found in Supabase, will create order without user_id');
            }
          } catch (error) {
            console.error('OrderContext: Error getting user from Supabase:', error);
          }
        }
        
        // Convert order items from object to array format for Supabase
        const orderItems = Object.values(order.items || {}).map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }));
        
        console.log('OrderContext: Converted order items:', orderItems);
        
        const orderData = {
          user_id: supabaseUserId, // Use Supabase UUID instead of Firebase UID
          user_name: currentUser.name || 'Unknown User', // Add user name
          user_email: currentUser.email || '', // Add user email
          order_amount: order.total || 0,
          status: 'pending', // Start as pending for staff approval
          items: orderItems // Include items for order creation
        };
        
        console.log('OrderContext: Order data prepared for Supabase:', orderData);
        
        const supabaseResult = await createOrder(orderData)
        
        if (supabaseResult.success) {
          console.log('OrderContext: Order successfully created in Supabase:', supabaseResult.order.id)
          // Track this order as created in Supabase
          setSupabaseOrderIds(prev => new Set([...prev, order.id]))
        } else {
          console.error('OrderContext: Failed to create order in Supabase:', supabaseResult.error)
        }
      } catch (error) {
        console.error('OrderContext: Error creating order in Supabase:', error)
      }
      
      // Add order to Google Sheets (existing functionality)
      try {
        const result = await addOrderToGoogleSheets(order)
        if (result.success) {
          console.log('OrderContext: Order successfully prepared for Google Sheets:', result.message)
        } else {
          console.error('OrderContext: Failed to prepare order for Google Sheets:', result.message)
        }
      } catch (error) {
        console.error('OrderContext: Error adding order to Google Sheets:', error)
      }
    } else {
      console.warn('OrderContext: Order not added - payment not confirmed:', order.id)
    }
  }

  const getCompletedOrders = () => {
    return completedOrders
  }

  const syncFromGoogleSheets = async () => {
    try {
      const result = await syncOrdersFromGoogleSheets()
      if (result.success) {
        // Merge Google Sheets orders with local orders
        const googleSheetsOrders = result.orders || []
        const allOrders = [...completedOrders, ...googleSheetsOrders]
        
        // Remove duplicates based on order ID
        const uniqueOrders = allOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.id === order.id)
        )
        
        setCompletedOrders(uniqueOrders)
        return {
          success: true,
          message: 'Orders synced from Google Sheets',
          newOrders: googleSheetsOrders.length
        }
      }
      return result
    } catch (error) {
      console.error('Error syncing from Google Sheets:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  const clearOrders = () => {
    setCompletedOrders([])
    localStorage.removeItem('completedOrders')
    localStorage.removeItem('googleSheetsOrders')
    localStorage.removeItem('googleSheetsOrdersConverted')
  }

  const value = {
    completedOrders,
    addCompletedOrder,
    getCompletedOrders,
    syncFromGoogleSheets,
    clearOrders
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
} 