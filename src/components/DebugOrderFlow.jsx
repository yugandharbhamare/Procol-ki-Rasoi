import { useState, useEffect } from 'react'
import { useOrders } from '../contexts/OrderContext'
import { useAuth } from '../contexts/AuthContext'

const DebugOrderFlow = () => {
  const { completedOrders } = useOrders()
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState({})

  useEffect(() => {
    // Check localStorage
    const localStorageOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]')
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    
    setDebugInfo({
      completedOrdersCount: completedOrders.length,
      localStorageOrdersCount: localStorageOrders.length,
      currentUser: currentUser,
      user: user,
      completedOrders: completedOrders,
      localStorageOrders: localStorageOrders
    })
  }, [completedOrders, user])

  const testOrderCreation = async () => {
    try {
      console.log('🔍 Testing order creation...')
      
      // Create a test order
      const testOrder = {
        id: `DEBUG_${Date.now()}`,
        items: {
          'test_item': {
            name: 'Test Item',
            price: 10,
            quantity: 1,
            image: '🍽️'
          }
        },
        total: 10,
        timestamp: new Date().toISOString(),
        user: {
          uid: user?.uid || 'test-uid',
          email: user?.email || 'test@example.com',
          displayName: user?.displayName || 'Test User',
          firstName: user?.firstName || 'Test',
          lastName: user?.lastName || 'User'
        },
        paymentDetails: {
          transactionId: `DEBUG_TXN_${Date.now()}`,
          paymentMethod: 'UPI',
          amount: 10,
          status: 'success',
          timestamp: new Date().toISOString()
        }
      }

      console.log('🔍 Test order created:', testOrder)

      // Add to localStorage directly
      const existingOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]')
      const updatedOrders = [testOrder, ...existingOrders]
      localStorage.setItem('completedOrders', JSON.stringify(updatedOrders))
      
      console.log('🔍 Test order added to localStorage')
      
      // Force a page reload to see if OrderContext picks it up
      window.location.reload()
      
    } catch (error) {
      console.error('🔍 Error in test order creation:', error)
    }
  }

  const clearOrders = () => {
    localStorage.removeItem('completedOrders')
    window.location.reload()
  }

  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg z-50">
        <p className="text-sm">🔍 Debug: Please login first to test order flow</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold mb-2">🔍 Order Flow Debug</h3>
      
      <div className="text-xs space-y-1 mb-3">
        <p>User: {user?.email || 'Not logged in'}</p>
        <p>Context Orders: {debugInfo.completedOrdersCount || 0}</p>
        <p>LocalStorage Orders: {debugInfo.localStorageOrdersCount || 0}</p>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={testOrderCreation}
          className="w-full bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
        >
          Test Order Creation
        </button>
        
        <button
          onClick={clearOrders}
          className="w-full bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
        >
          Clear All Orders
        </button>
      </div>
      
      <details className="mt-2">
        <summary className="text-xs cursor-pointer">View Debug Data</summary>
        <pre className="text-xs mt-1 bg-white p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  )
}

export default DebugOrderFlow
