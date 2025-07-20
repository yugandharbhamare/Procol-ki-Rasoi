import { createContext, useContext, useState, useEffect } from 'react'

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

  const addCompletedOrder = (order) => {
    setCompletedOrders(prev => [order, ...prev])
  }

  const getCompletedOrders = () => {
    return completedOrders
  }

  const clearOrders = () => {
    setCompletedOrders([])
    localStorage.removeItem('completedOrders')
  }

  const value = {
    completedOrders,
    addCompletedOrder,
    getCompletedOrders,
    clearOrders
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
} 