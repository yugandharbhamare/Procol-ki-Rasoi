import { createContext, useContext, useState, useEffect } from 'react'
import { addOrderToGoogleSheets, syncOrdersFromGoogleSheets } from '../services/googleSheetsService'
import { createOrder, ORDER_STATUS } from '../services/firestoreService'

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
    
    // Only add orders that have been successfully paid
    if (order.paymentDetails && order.paymentDetails.status === 'success') {
      console.log('OrderContext: Payment confirmed, adding order to state and Firestore');
      setCompletedOrders(prev => [order, ...prev])
      
      // Add order to Firestore
      try {
        console.log('OrderContext: Creating order in Firestore...');
        const firestoreResult = await createOrder({
          ...order,
          status: ORDER_STATUS.PENDING, // Start as pending for staff approval
          paymentConfirmed: true,
          paymentDetails: order.paymentDetails
        })
        
        if (firestoreResult.success) {
          console.log('OrderContext: Order successfully created in Firestore:', firestoreResult.orderId)
        } else {
          console.error('OrderContext: Failed to create order in Firestore:', firestoreResult.error)
        }
      } catch (error) {
        console.error('OrderContext: Error creating order in Firestore:', error)
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