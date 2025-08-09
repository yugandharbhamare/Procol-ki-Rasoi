import { useState, useEffect } from 'react'
import UPIQRCode from './UPIQRCode'
import { initializePayment, checkPaymentStatus } from '../services/paymentService'

const PaymentScreen = ({ order, onPaymentComplete, onBack }) => {
  const [isQRVisible, setIsQRVisible] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, processing, success, failed
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect if user is on mobile device
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
      
      // Auto-show QR code for desktop users
      if (!isMobileDevice) {
        setIsQRVisible(true)
      }
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])



  const handlePaymentMethodSelect = (app) => {
    // Don't allow changing payment method if payment is in progress
    if (paymentStatus === 'processing') return
    setSelectedPaymentMethod(app)
  }

  const handlePayNow = () => {
    if (!selectedPaymentMethod) return
    
    const amount = getTotalPrice() > 0 ? getTotalPrice() : 0
    const upiId = 'Q629741098@ybl'
    const orderId = order.id
    
    let deepLink = ''
    
    if (selectedPaymentMethod === 'gpay') {
      // Google Pay specific deep link
      const gpayUrl = `gpay://upi/pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
      
      // Try to open Google Pay directly
      window.location.href = gpayUrl
      
      // Set processing status and fallback (QR code only on desktop)
      setPaymentStatus('processing')
      // Only show QR code on desktop devices
      if (window.innerWidth >= 768) {
        setTimeout(() => {
          setIsQRVisible(true)
        }, 2000)
      }
      return
    } else if (selectedPaymentMethod === 'phonepe') {
      // PhonePe deep link
      deepLink = `phonepe://pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    } else if (selectedPaymentMethod === 'paytm') {
      // Paytm deep link
      deepLink = `paytmmp://pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    } else if (selectedPaymentMethod === 'bhim') {
      // BHIM deep link
      deepLink = `bhim://upi/pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    }
    
    if (deepLink) {
      setPaymentStatus('processing')
      // Try to open the app
      window.location.href = deepLink
      
      // Fallback: If app doesn't open, show QR code after a delay (desktop only)
      if (window.innerWidth >= 768) {
        setTimeout(() => {
          setIsQRVisible(true)
        }, 2000)
      }
    }
  }

  const handlePaymentSuccess = () => {
    console.log('PaymentScreen: Payment success triggered, setting status to success');
    setPaymentStatus('success')
    
    // Automatically redirect to receipt page after payment success
    setTimeout(() => {
      console.log('PaymentScreen: Calling onPaymentComplete callback');
      onPaymentComplete()
    }, 1500)
  }

  const handlePaymentFailed = () => {
    setPaymentStatus('failed')
  }

  // Initialize payment when component mounts
  useEffect(() => {
    const initPayment = async () => {
      try {
        console.log('PaymentScreen: Initializing payment for order:', order)
        const result = await initializePayment(order)
        if (result.success) {
          console.log('PaymentScreen: Payment initialized successfully:', result)
        } else {
          console.error('PaymentScreen: Payment initialization failed:', result.error)
        }
      } catch (error) {
        console.error('PaymentScreen: Error initializing payment:', error)
      }
    }
    
    initPayment()
  }, [order])

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
        {/* Combined Header, Order Summary and Payment */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-6">
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

          {/* Order Header Section */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Order</h2>
            <p className="text-gray-600">Order #{order.id}</p>
          </div>

          {/* End-to-end divider */}
          <div className="border-t border-gray-200 -mx-6 mb-6"></div>
          {/* Order Summary Section */}
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
            </span>
          </div>
          
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
          
          <div className="border-t border-gray-200 pt-4 mb-4">
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

          {/* End-to-end divider */}
          <div className="border-t border-gray-200 -mx-6 my-6"></div>

          {/* Payment Section */}
          {!isQRVisible && isMobile && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              {paymentStatus === 'processing' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Payment in progress. Please complete the payment in your UPI app before selecting another method.
                  </p>
                </div>
              )}
              
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
                  onClick={() => handlePaymentMethodSelect('gpay')}
                  className={`border rounded-lg p-4 transition-colors ${
                    paymentStatus === 'processing'
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                      : selectedPaymentMethod === 'gpay' 
                        ? 'border-green-500 bg-green-50 cursor-pointer' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <img 
                          src="/icons8-google-pay.svg" 
                          alt="Google Pay" 
                          className="w-8 h-8"
                          loading="eager"
                          decoding="sync"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold text-xs" style={{display: 'none'}}>
                          GP
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Google Pay</p>
                        <p className="text-sm text-gray-600">Pay using Google Pay</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'gpay' ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* PhonePe */}
                <div 
                  onClick={() => handlePaymentMethodSelect('phonepe')}
                  className={`border rounded-lg p-4 transition-colors ${
                    paymentStatus === 'processing'
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                      : selectedPaymentMethod === 'phonepe' 
                        ? 'border-purple-500 bg-purple-50 cursor-pointer' 
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <img 
                          src="/icons8-phone-pe.svg" 
                          alt="PhonePe" 
                          className="w-8 h-8"
                          loading="eager"
                          decoding="sync"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white font-bold text-xs" style={{display: 'none'}}>
                          PP
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">PhonePe</p>
                        <p className="text-sm text-gray-600">Pay using PhonePe</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'phonepe' ? (
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Paytm */}
                <div 
                  onClick={() => handlePaymentMethodSelect('paytm')}
                  className={`border rounded-lg p-4 transition-colors ${
                    paymentStatus === 'processing'
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                      : selectedPaymentMethod === 'paytm' 
                        ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <img 
                          src="/icons8-paytm.svg" 
                          alt="Paytm" 
                          className="w-8 h-8"
                          loading="eager"
                          decoding="sync"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs" style={{display: 'none'}}>
                          PT
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Paytm</p>
                        <p className="text-sm text-gray-600">Pay using Paytm</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'paytm' ? (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* BHIM */}
                <div 
                  onClick={() => handlePaymentMethodSelect('bhim')}
                  className={`border rounded-lg p-4 transition-colors ${
                    paymentStatus === 'processing'
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                      : selectedPaymentMethod === 'bhim' 
                        ? 'border-orange-500 bg-orange-50 cursor-pointer' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <img 
                          src="/icons8-bhim.svg" 
                          alt="BHIM" 
                          className="w-8 h-8"
                          loading="eager"
                          decoding="sync"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-xs" style={{display: 'none'}}>
                          BH
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">BHIM</p>
                        <p className="text-sm text-gray-600">Pay using BHIM</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'bhim' ? (
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Section for Desktop */}
          {isQRVisible && !isMobile && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Scan QR Code to Pay</h3>
              
              <UPIQRCode
                amount={getTotalPrice() > 0 ? getTotalPrice() : 0}
                orderId={order.id}
                upiId="Q629741098@ybl"
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentFailed={handlePaymentFailed}
              />
            </div>
          )}
        </div>





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
        {!isQRVisible && paymentStatus === 'pending' && isMobile && (
          <div className="space-y-3">
            <button
              onClick={handlePayNow}
              disabled={!selectedPaymentMethod}
              className={`w-full py-4 text-lg font-semibold rounded-lg transition-colors ${
                selectedPaymentMethod
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedPaymentMethod ? 'Pay Now' : 'Select a payment method'}
            </button>
            <button
              onClick={onBack}
              disabled={paymentStatus === 'processing'}
              className={`w-full py-3 rounded-lg transition-colors ${
                paymentStatus === 'processing'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'btn-secondary'
              }`}
            >
              Back to Cart
            </button>
          </div>
        )}

        {isQRVisible && paymentStatus === 'pending' && isMobile && (
          <button
            onClick={() => setIsQRVisible(false)}
            className="w-full btn-secondary py-3"
          >
            Back to Payment Options
          </button>
        )}

        {/* Desktop QR Code Action Buttons */}
        {isQRVisible && paymentStatus === 'pending' && !isMobile && (
          <div className="space-y-3">
            <button
              onClick={onBack}
              disabled={paymentStatus === 'processing'}
              className={`w-full py-3 rounded-lg transition-colors ${
                paymentStatus === 'processing'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'btn-secondary'
              }`}
            >
              Back to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentScreen 