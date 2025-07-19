import { useState } from 'react'
import UPIQRCode from './UPIQRCode'

const PaymentScreen = ({ order, onPaymentComplete, onBack }) => {
  const [isQRVisible, setIsQRVisible] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, processing, success, failed

  const handlePayNow = () => {
    setIsQRVisible(true)
    setPaymentStatus('processing')
  }

  const handleUPIPayment = (app) => {
    const amount = getTotalPrice() > 0 ? getTotalPrice() : 0
    const upiId = 'Q629741098@ybl'
    const orderId = order.id
    
    let deepLink = ''
    
    if (app === 'gpay') {
      // Google Pay deep link
      deepLink = `googleplay://upi/pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    } else if (app === 'phonepe') {
      // PhonePe deep link
      deepLink = `phonepe://pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    } else if (app === 'paytm') {
      // Paytm deep link
      deepLink = `paytmmp://pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    } else if (app === 'bhim') {
      // BHIM deep link
      deepLink = `bhim://upi/pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    }
    
    if (deepLink) {
      // Try to open the app
      window.location.href = deepLink
      
      // Fallback: If app doesn't open, show QR code after a delay
      setTimeout(() => {
        setIsQRVisible(true)
        setPaymentStatus('processing')
      }, 2000)
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentStatus('success')
    setTimeout(() => {
      onPaymentComplete()
    }, 2000)
  }

  const handlePaymentFailed = () => {
    setPaymentStatus('failed')
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4 max-w-md">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Payment</h1>
            <div className="w-6"></div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Order</h2>
            <p className="text-gray-600">Order #{order.id}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          
          <div className="space-y-3 mb-4">
            {Object.entries(order.items).map(([itemId, item]) => (
              <div key={itemId} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {typeof item.price === 'number' && (
                      <p className="text-sm text-gray-500">• ₹{item.price} each</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {typeof item.price === 'number' ? `₹${item.price * item.quantity}` : 'MRP'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Items ({getTotalItems()})</span>
              <span className="text-gray-900 font-medium">
                {getTotalPrice() > 0 ? `₹${getTotalPrice()}` : 'MRP Items'}
              </span>
            </div>
            {hasMRPItems && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">MRP Items</span>
                <span className="text-gray-900 font-medium">As marked</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>
                {getTotalPrice() > 0 ? `₹${getTotalPrice()}` : 'MRP Items Only'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        {!isQRVisible && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
            
            {/* UPI ID Display */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">UPI ID</p>
                  <p className="text-lg font-bold text-gray-900">Q629741098@ybl</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-lg font-bold text-primary-600">
                    ₹{getTotalPrice() > 0 ? getTotalPrice() : 'MRP'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* GPay */}
              <div 
                onClick={() => handleUPIPayment('gpay')}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">GPay</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Google Pay</p>
                      <p className="text-sm text-gray-600">Pay using Google Pay</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* PhonePe */}
              <div 
                onClick={() => handleUPIPayment('phonepe')}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">PhonePe</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">PhonePe</p>
                      <p className="text-sm text-gray-600">Pay using PhonePe</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Paytm */}
              <div 
                onClick={() => handleUPIPayment('paytm')}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">Paytm</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Paytm</p>
                      <p className="text-sm text-gray-600">Pay using Paytm</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* BHIM */}
              <div 
                onClick={() => handleUPIPayment('bhim')}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">BHIM</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">BHIM</p>
                      <p className="text-sm text-gray-600">Pay using BHIM</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* QR Code Option */}
              <div 
                onClick={() => setIsQRVisible(true)}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Scan QR Code</p>
                      <p className="text-sm text-gray-600">Pay using any UPI app</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPI QR Code */}
        {isQRVisible && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Scan QR Code to Pay</h3>
            
            <UPIQRCode
              amount={getTotalPrice() > 0 ? getTotalPrice() : 0}
              orderId={order.id}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailed={handlePaymentFailed}
            />
          </div>
        )}

        {/* Payment Status */}
        {paymentStatus === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-blue-800">Processing payment...</p>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800">Payment successful! Redirecting...</p>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-red-800">Payment failed. Please try again.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isQRVisible && paymentStatus === 'pending' && (
          <div className="space-y-3">
            <button
              onClick={handlePayNow}
              className="w-full btn-primary py-4 text-lg font-semibold"
            >
              Pay Now
            </button>
            <button
              onClick={onBack}
              className="w-full btn-secondary py-3"
            >
              Back to Cart
            </button>
          </div>
        )}

        {isQRVisible && paymentStatus === 'pending' && (
          <button
            onClick={() => setIsQRVisible(false)}
            className="w-full btn-secondary py-3"
          >
            Back to Payment Options
          </button>
        )}
      </div>
    </div>
  )
}

export default PaymentScreen 