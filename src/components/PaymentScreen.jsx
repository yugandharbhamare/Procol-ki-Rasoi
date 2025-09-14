import { useState, useEffect } from 'react'
import UPIQRCode from './UPIQRCode'
import { initializePayment, checkPaymentStatus } from '../services/paymentService'
import { ChevronLeftIcon, CreditCardIcon, CheckIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'

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

  const openPaymentApp = (app) => {
    const amount = getTotalPrice() > 0 ? getTotalPrice() : 0
    const upiId = 'Q629741098@ybl'
    const orderId = order.id
    
    let appUrl = ''
    
    switch (app) {
      case 'gpay':
        // Open Google Pay with QR scanner
        appUrl = 'gpay://'
        break
      case 'phonepe':
        // Open PhonePe with QR scanner
        appUrl = 'phonepe://'
        break
      case 'paytm':
        // Open Paytm with QR scanner
        appUrl = 'paytmmp://'
        break
      case 'bhim':
        // Open BHIM with QR scanner
        appUrl = 'bhim://'
        break
      default:
        return
    }
    
    // Try to open the app
    window.location.href = appUrl
    
    // Set processing status
    setPaymentStatus('processing')
  }

  const handlePayNow = () => {
    if (!selectedPaymentMethod) return
    
    // For mobile: Open the payment app for QR scanning
    if (isMobile) {
      openPaymentApp(selectedPaymentMethod)
    } else {
      // For desktop: Show QR code
      setPaymentStatus('processing')
      setTimeout(() => {
        setIsQRVisible(true)
      }, 1000)
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

  const handlePaymentCompleted = () => {
    console.log('PaymentScreen: User confirmed payment completion');
    setPaymentStatus('success')
    
    // Automatically redirect to receipt page after payment confirmation
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
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Payment</h1>
            <div className="w-6"></div>
          </div>

          {/* Order Header Section */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="w-8 h-8 text-primary-600" />
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
              {/* Payment Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">How to Pay</h4>
                <p className="text-sm text-blue-800">
                  1. Select your payment app below<br/>
                  2. Open the app and use QR scanner<br/>
                  3. Scan the QR code at the payment counter<br/>
                  4. Complete payment and return here
                </p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              {paymentStatus === 'processing' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Payment in progress. Please complete the payment in your UPI app before selecting another method.
                  </p>
                </div>
              )}

              
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
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
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
                      <CheckIcon className="w-5 h-5 text-purple-600" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
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
                      <CheckIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
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
                      <CheckIcon className="w-5 h-5 text-orange-600" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
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
              <CheckIcon className="w-6 h-6 text-green-600" />
              <p className="text-green-800">Payment successful! Redirecting...</p>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <XMarkIcon className="w-6 h-6 text-red-600" />
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
              Open Payment App
            </button>
          </div>
        )}

        {/* Payment Completion Button */}
        {paymentStatus === 'processing' && isMobile && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-900">Payment App Opened</h4>
                  <p className="text-sm text-green-800">Complete your payment and return here</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handlePaymentCompleted}
              className="w-full py-4 text-lg font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              I have completed the payment
            </button>
            
            <button
              onClick={() => setPaymentStatus('pending')}
              className="w-full py-3 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cancel Payment
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
      </div>
    </div>
  )
}

export default PaymentScreen 