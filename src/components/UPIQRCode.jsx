import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { checkPaymentStatus, simulatePaymentConfirmation } from '../services/paymentService'

const UPIQRCode = ({ amount, orderId, upiId = "Q629741098@ybl", onPaymentSuccess, onPaymentFailed }) => {
  const canvasRef = useRef(null)
  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, processing, success, failed
  const [statusMessage, setStatusMessage] = useState('')
  const statusCheckInterval = useRef(null)

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Create UPI payment URL
        const upiUrl = `upi://pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
        
        // Generate QR code
        await QRCode.toCanvas(canvasRef.current, upiUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQRCode()
    
    // Start monitoring payment status
    startPaymentMonitoring()
    
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }
    }
  }, [amount, orderId, upiId])

  const startPaymentMonitoring = () => {
    // Check payment status every 3 seconds
    statusCheckInterval.current = setInterval(async () => {
      try {
        const result = await checkPaymentStatus(orderId)
        
        if (result.success) {
          if (result.status === 'success') {
            setPaymentStatus('success')
            setStatusMessage('Payment successful! Processing your order...')
            onPaymentSuccess()
            clearInterval(statusCheckInterval.current)
          } else if (result.status === 'failed') {
            setPaymentStatus('failed')
            setStatusMessage('Payment failed. Please try again.')
            onPaymentFailed()
            clearInterval(statusCheckInterval.current)
          } else if (result.status === 'pending') {
            setPaymentStatus('pending')
            setStatusMessage('Waiting for payment confirmation...')
          }
        }
      } catch (error) {
        console.error('Payment status check error:', error)
      }
    }, 3000)
  }

  const handleUPIAppOpen = () => {
    // UPI deep link format for opening UPI apps
    const upiUrl = `upi://pay?pa=${upiId}&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    
    // Try to open UPI app
    window.location.href = upiUrl
    
    // Fallback: Show instructions
    setTimeout(() => {
      alert("If UPI app didn't open automatically, please scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)")
    }, 1000)
  }

  return (
    <div className="text-center">
      <div className="bg-gray-100 rounded-lg p-6 mb-4 inline-block">
        <div className="w-48 h-48 bg-white rounded-lg p-4 border-2 border-gray-300 flex items-center justify-center">
          <canvas 
            ref={canvasRef}
            className="w-full h-full"
            alt="UPI QR Code"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Amount to pay: <span className="font-semibold text-gray-900">₹{amount}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            UPI ID: <span className="font-semibold text-gray-900">{upiId}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Order ID: {orderId}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Scan QR code with any UPI app to complete payment
          </p>
          
          {/* Payment Status Display */}
          {paymentStatus !== 'pending' && (
            <div className={`mt-4 p-3 rounded-lg ${
              paymentStatus === 'success' 
                ? 'bg-green-50 text-green-800' 
                : paymentStatus === 'failed'
                ? 'bg-red-50 text-red-800'
                : 'bg-blue-50 text-blue-800'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                {paymentStatus === 'success' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {paymentStatus === 'failed' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {paymentStatus === 'processing' && (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span className="text-sm font-medium">{statusMessage}</span>
              </div>
            </div>
          )}
          
          {/* Demo Payment Button (for testing) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4">
              <button
                onClick={async () => {
                  setPaymentStatus('processing')
                  setStatusMessage('Simulating payment confirmation...')
                  await simulatePaymentConfirmation(orderId)
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Simulate Payment (Demo)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UPIQRCode 