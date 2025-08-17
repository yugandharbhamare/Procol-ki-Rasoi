import { useState, useEffect } from 'react'

const ReceiptModal = ({ order }) => {


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
    return Object.values(order.items).reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return Object.values(order.items).reduce((total, item) => {
      if (typeof item.price === 'number') {
        return total + (item.price * item.quantity)
      }
      return total
    }, 0)
  }

  const hasMRPItems = Object.values(order.items).some(item => typeof item.price !== 'number')

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50">
      {/* Receipt Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-primary-100">Your order has been confirmed</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          {/* Order Info */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Order ID</span>
              <span className="font-semibold text-gray-900">{order.id}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Date</span>
              <span className="font-semibold text-gray-900">{formatDate(new Date(order.timestamp))}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Time</span>
              <span className="font-semibold text-gray-900">{formatTime(new Date(order.timestamp))}</span>
            </div>
            {order.user && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-semibold text-gray-900">{order.user.displayName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email</span>
                  <span className="font-semibold text-gray-900">{order.user.email}</span>
                </div>
              </>
            )}
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(order.items).map(([itemId, item]) => (
                <div key={itemId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {item.image && item.image.startsWith('/') ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'block'
                          }}
                        />
                      ) : null}
                      <span className="text-2xl" style={{ display: item.image && item.image.startsWith('/') ? 'none' : 'block' }}>
                        {item.image || '🍽️'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          {typeof item.price === 'number' && (
                            <p className="text-xs text-gray-500">• ₹{item.price} each</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                                      <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {typeof item.price === 'number' ? `₹${item.item_amount || (item.price * item.quantity)}` : 'MRP'}
                      </p>
                    </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider between items and total */}
          <div className="mb-6">
            <div className="h-px bg-gray-200"></div>
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
              <span className="text-xl font-bold text-primary-600">
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

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800">UPI Payment</p>
                  <p className="text-sm text-green-600">Q629741098@ybl</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🍛</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600">Your order will be ready soon. We appreciate your business!</p>
          </div>

          {/* Card Footer - Scrolling Ticker */}
          <div className="overflow-hidden -mx-6 -mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2">
              <div className="animate-marquee whitespace-nowrap">
                <span className="inline-block px-4">
                  Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛 • Thank you for supporting Procol ki Rasoi 🍛
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptModal 