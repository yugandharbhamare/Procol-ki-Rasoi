import React, { createContext, useContext, useState, useEffect } from 'react'
import { createOrder, getUserByEmail } from '../services/supabaseService'
import { addOrderToGoogleSheets, syncOrdersFromGoogleSheets } from '../services/googleSheetsService'
import notificationService from '../services/notificationService'

const OrderContext = createContext()

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}

export const OrderProvider = ({ children }) => {
  const [supabaseOrderIds, setSupabaseOrderIds] = useState(new Set())
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(true)

  // No longer using local storage - Supabase is the single source of truth

  const addCompletedOrder = async (order) => {
    console.log('OrderContext: addCompletedOrder called with:', order)
    
    // Check if order is already being processed
    if (supabaseOrderIds.has(order.id)) {
      console.log('OrderContext: Order already being processed:', order.id)
      return
    }

    // No need to check local state since we're not storing orders locally

    // Add to processing set
    setSupabaseOrderIds(prev => new Set(prev).add(order.id))

    // Don't add to local state - let Supabase be the single source of truth
    // The OrderHistory component will fetch from Supabase after creation

    // Try to create order in Supabase if available
    try {
      // Get user info from the order
      const user = order.user || {}
      const userPhotoURL = user.photoURL || user.photo_url || ''
      const userEmail = user.email || 'unknown@email.com'
      
      console.log('OrderContext: Getting Supabase user ID for email:', userEmail)
      
      // Get Supabase user ID by email
      const userResult = await getUserByEmail(userEmail)
      let supabaseUserId = null
      
      if (userResult.success && userResult.user) {
        supabaseUserId = userResult.user.id
        console.log('OrderContext: Found Supabase user ID:', supabaseUserId)
      } else {
        console.error('OrderContext: User not found in Supabase for email:', userEmail)
        console.error('OrderContext: User result:', userResult)
        
        // If Supabase is not available, continue with local storage only
        if (userResult.error && userResult.error.includes('Supabase is not available')) {
          console.warn('OrderContext: Supabase not available, storing order locally only')
          setIsSupabaseAvailable(false)
          
          // Remove from processing set since we're not using Supabase
          setSupabaseOrderIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(order.id)
            return newSet
          })
          
          // Continue with Google Sheets and local storage
        } else {
          throw new Error('User not found in Supabase. Please sign in again.')
        }
      }
      
      // Only proceed with Supabase if we have a user ID
      if (supabaseUserId) {
        // Prepare order items for Supabase
        const orderItems = Object.values(order.items || {}).map(item => ({
          item_name: item.name,
          quantity: item.quantity,
          price: item.price
        }))

        // Prepare order data for Supabase
        const orderData = {
          user_id: supabaseUserId, // Use Supabase user ID, not Firebase UID
          user_name: user.displayName || user.firstName + ' ' + user.lastName || 'Unknown User',
          user_email: userEmail,
          user_photo_url: userPhotoURL,
          order_amount: order.total || 0,
          custom_order_id: order.id, // Use the simplified order ID (e.g., ORD123456)
          status: 'pending', // Start as pending for staff approval
          notes: order.notes || null, // Include order notes for chef
          items: orderItems // Include items for order creation
        }
        
        console.log('OrderContext: Order data prepared for Supabase:', orderData)
        console.log('OrderContext: User name being sent:', orderData.user_name)
        console.log('OrderContext: User email being sent:', orderData.user_email)
        console.log('OrderContext: Supabase user ID being sent:', orderData.user_id)
        
        let supabaseResult
        try {
          supabaseResult = await createOrder(orderData)
        } catch (createError) {
          console.error('OrderContext: createOrder threw an error:', createError)
          supabaseResult = { success: false, error: createError.message }
        }
        
        if (supabaseResult.success) {
          console.log('OrderContext: Order successfully created in Supabase:', supabaseResult.order.id)
          // Remove from processing set since order is now in Supabase
          setSupabaseOrderIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(order.id)
            return newSet
          })
        } else {
          console.error('OrderContext: Failed to create order in Supabase:', supabaseResult.error)
          console.error('OrderContext: Order data that failed:', orderData)
          // Remove from processing set if failed
          setSupabaseOrderIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(order.id)
            return newSet
          })
        }
      }
    } catch (error) {
      console.error('OrderContext: Error creating order in Supabase:', error)
      
      // If it's a Supabase availability error, mark as unavailable
      if (error.message && error.message.includes('Supabase is not available')) {
        setIsSupabaseAvailable(false)
        console.warn('OrderContext: Supabase marked as unavailable')
      }
      
      // Remove from processing set if failed
      setSupabaseOrderIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(order.id)
        return newSet
      })
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
  }

  // Function to notify about order status changes
  const notifyOrderStatusChange = (orderId, status, message) => {
    notificationService.notifyOrderStatusChange(orderId, status, message);
  };

  const value = {
    addCompletedOrder,
    isSupabaseAvailable,
    notifyOrderStatusChange
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
} 