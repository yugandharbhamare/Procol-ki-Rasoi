import { useState, useEffect } from 'react'
import { normalizeOrderForReceipt, getOrderStatusDisplay } from '../utils/orderUtils'

const ReceiptScreen = ({ order, onBack }) => {
  // Normalize the order data for consistent display
  const normalizedOrder = normalizeOrderForReceipt(order)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Get the correct order status display
  const orderStatus = getOrderStatusDisplay(order)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const getTotalItems = () => {
    return Object.keys(normalizedOrder.items).length
  }

  const getTotalPrice = () => {
    return Object.values(normalizedOrder.items).reduce((total, item) => {
      if (typeof item.price === 'number') {
        return total + (item.price * item.quantity)
      }
      return total
    }, 0)
  }

  const hasMRPItems = Object.values(normalizedOrder.items).some(item => typeof item.price !== 'number')

  return (
    <div className="receipt-screen-container min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="receipt-header bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">🍽️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Procol ki Rasoi</h1>
                <p className="text-sm text-gray-600">Receipt</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="receipt-main-content flex-1 flex items-center justify-center px-4 py-6">
        <div className="receipt-wrapper w-full max-w-[400px]">
          {/* Receipt Card */}
          <div className="receipt-card bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Receipt Header */}
            <div className={`receipt-header-section text-white p-6 text-center ${orderStatus.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : (orderStatus.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600' : (orderStatus.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'))}`}>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">{orderStatus.icon}</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{orderStatus.status}</h2>
              <p className={`${orderStatus.color === 'blue' ? 'text-blue-100' : (orderStatus.color === 'green' ? 'text-green-100' : (orderStatus.color === 'red' ? 'text-red-100' : 'text-orange-100'))}`}>{orderStatus.description}</p>
            </div>

            {/* Receipt Content */}
            <div className="receipt-content p-6">
              {/* Order Info */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-semibold text-gray-900">{normalizedOrder.id}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold text-gray-900">{formatDate(currentTime)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Time</span>
                  <span className="font-semibold text-gray-900">{formatTime(currentTime)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-semibold text-gray-900">{normalizedOrder.customerName}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {Object.entries(normalizedOrder.items).map(([itemId, item]) => (
                    <div key={itemId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <span className="text-gray-500 text-sm ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {typeof item.price === 'number' ? `₹${item.price}` : 'MRP'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-6">
                {hasMRPItems && (
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">MRP Items</span>
                    <span className="font-semibold text-gray-900">As marked</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className={`text-xl font-bold ${orderStatus.color === 'blue' ? 'text-blue-600' : (orderStatus.color === 'green' ? 'text-green-600' : (orderStatus.color === 'red' ? 'text-red-600' : 'text-orange-600'))}`}>
                    {getTotalPrice() > 0 ? `₹${getTotalPrice()}` : 'MRP Items Only'}
                  </span>
                </div>
              </div>

              {/* Zig-zag Separator */}
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <div className="mx-4 flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-300 transform rotate-45"></div>
                    <div className="w-2 h-2 bg-gray-300 transform -rotate-45"></div>
                    <div className="w-2 h-2 bg-gray-300 transform rotate-45"></div>
                    <div className="w-2 h-2 bg-gray-300 transform -rotate-45"></div>
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              </div>

              {/* Thank You Message */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${orderStatus.color === 'blue' ? 'bg-blue-100' : (orderStatus.color === 'green' ? 'bg-green-100' : (orderStatus.color === 'red' ? 'bg-red-100' : 'bg-orange-100'))}`}>
                  <span className="text-2xl">🍛</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600">
                  {orderStatus.status === 'Payment Received' 
                    ? 'Your payment has been received. We will notify you when your order is accepted and ready.'
                    : orderStatus.status === 'Order Accepted'
                    ? 'Your order is being prepared. We will notify you when it\'s ready for pickup.'
                    : orderStatus.status === 'Ready for Pickup'
                    ? 'Your order is ready! Please collect it from the counter.'
                    : 'We appreciate your business!'
                  }
                </p>
              </div>

              {/* Card Footer - Scrolling Ticker */}
              <div className="overflow-hidden -mx-6 -mb-6">
                <div className={`text-white py-2 ${orderStatus.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : (orderStatus.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600' : (orderStatus.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'))}`}>
                  <div className="animate-marquee whitespace-nowrap">
                    <span className="inline-block px-4">
                      Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Order Button */}
          <div className="mt-6">
            <button
              onClick={onBack}
              className="w-full bg-orange-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-orange-700 transition-colors shadow-lg"
            >
              Place New Order
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .receipt-screen-container {
          width: 100% !important;
          max-width: none !important;
        }
        
        .receipt-main-content {
          width: 100% !important;
          max-width: none !important;
        }
        
        .receipt-wrapper {
          width: 100% !important;
          max-width: 400px !important;
        }
        
        .receipt-card {
          width: 100% !important;
          max-width: 400px !important;
        }
      `}</style>
    </div>
  )
}

export default ReceiptScreen 