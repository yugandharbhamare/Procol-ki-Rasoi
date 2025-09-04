import React, { createContext, useContext, useState, useEffect } from 'react'
import { createOrder, getUserByEmail } from '../services/supabaseService'
import { addOrderToGoogleSheets, syncOrdersFromGoogleSheets } from '../services/googleSheetsService'

const OrderContext = createContext()

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}

export const OrderProvider = ({ children }) => {
  const [completedOrders, setCompletedOrders] = useState([])
  const [supabaseOrderIds, setSupabaseOrderIds] = useState(new Set())

  // Load completed orders from localStorage on component mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('completedOrders')
    if (savedOrders) {
      try {
        setCompletedOrders(JSON.parse(savedOrders))
      } catch (error) {
        console.error('Error parsing saved orders:', error)
        setCompletedOrders([])
      }
    }
  }, [])

  // Save completed orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('completedOrders', JSON.stringify(completedOrders))
  }, [completedOrders])

  const addCompletedOrder = async (order) => {
    console.log('OrderContext: addCompletedOrder called with:', order)
    
    // Check if order is already being processed
    if (supabaseOrderIds.has(order.id)) {
      console.log('OrderContext: Order already being processed:', order.id)
      return
    }

    // Check if order already exists
    if (completedOrders.find(o => o.id === order.id)) {
      console.log('OrderContext: Order already exists:', order.id)
      return
    }

    // Add to processing set
    setSupabaseOrderIds(prev => new Set(prev).add(order.id))

    // Add to local state immediately for UI responsiveness
    setCompletedOrders(prev => [...prev, order])

    // Create order in Supabase
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
        throw new Error('User not found in Supabase. Please sign in again.')
      }
      
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
        items: orderItems // Include items for order creation
      }
      
      console.log('OrderContext: Order data prepared for Supabase:', orderData)
      console.log('OrderContext: User name being sent:', orderData.user_name)
      console.log('OrderContext: User email being sent:', orderData.user_email)
      console.log('OrderContext: Supabase user ID being sent:', orderData.user_id)
      
      const supabaseResult = await createOrder(orderData)
      
      if (supabaseResult.success) {
        console.log('OrderContext: Order successfully created in Supabase:', supabaseResult.order.id)
        // Order is already tracked as being processed, no need to add again
      } else {
        console.error('OrderContext: Failed to create order in Supabase:', supabaseResult.error)
        // Remove from processing set if failed
        setSupabaseOrderIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(order.id)
          return newSet
        })
      }
    } catch (error) {
      console.error('OrderContext: Error creating order in Supabase:', error)
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