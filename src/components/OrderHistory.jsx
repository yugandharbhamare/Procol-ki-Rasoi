import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrders } from '../contexts/OrderContext'
import ReceiptModal from './ReceiptModal'

const OrderHistory = () => {
  const { user } = useAuth()
  const { completedOrders, syncFromGoogleSheets } = useOrders()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userOrders, setUserOrders] = useState([])



  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleViewReceipt = (order) => {
    setSelectedOrder(order)
  }

  const handleCloseReceipt = () => {
    setSelectedOrder(null)
  }

  // Load and filter orders for the current user
  useEffect(() => {
    const loadUserOrders = async () => {
      setIsLoading(true)
      
      try {
        // First sync from Google Sheets to get latest data
        await syncFromGoogleSheets()
        
        // Get all completed orders (local + Google Sheets)
        const allOrders = completedOrders
        
        // Filter orders for the current user
        const filteredOrders = allOrders.filter(order => {
          // Check if order has user email and it matches current user
          if (order.user && order.user.email) {
            return order.user.email === user.email
          }
          return false
        })
        
        // Sort by timestamp (newest first)
        const sortedOrders = filteredOrders.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        )
        
        setUserOrders(sortedOrders)
      } catch (error) {
        console.error('Error loading user orders:', error)
        // Fallback to local orders only
        const localUserOrders = completedOrders.filter(order => 
          order.user && order.user.email === user.email
        )
        setUserOrders(localUserOrders)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user && user.email) {
      loadUserOrders()
    }
  }, [user, completedOrders, syncFromGoogleSheets])





  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
                      <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Order History</h1>
                <p className="text-sm text-gray-600">View your past orders and receipts</p>
              </div>
            </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading your orders...</h3>
              <p className="text-gray-500">Fetching your order history from Google Sheets</p>
            </div>
          ) : (
            <>
                            {/* Orders List */}
              {userOrders.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed orders yet</h3>
                  <p className="text-gray-500">Your order history will appear here once you successfully place and pay for your first order.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => handleViewReceipt(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{order.id}</h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.timestamp)} at {formatTime(order.timestamp)} • {Object.keys(order.items).length} item{Object.keys(order.items).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">₹{order.total}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden relative">
            {/* Close Button */}
            <button
              onClick={handleCloseReceipt}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Receipt Content */}
            <div className="overflow-y-auto max-h-[90vh]">
              <ReceiptModal 
                order={selectedOrder} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderHistory 