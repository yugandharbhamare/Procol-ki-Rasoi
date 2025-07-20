import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

const UPIQRCode = ({ amount, orderId, upiId = "Q629741098@ybl", onPaymentSuccess, onPaymentFailed }) => {
  const canvasRef = useRef(null)
  const [showPaymentButton, setShowPaymentButton] = useState(false)

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
    
    // Show payment completion button after 5 seconds
    const timer = setTimeout(() => {
      setShowPaymentButton(true)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [amount, orderId, upiId])

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
          
          {showPaymentButton && (
            <div className="mt-4">
              <button
                onClick={onPaymentSuccess}
                className="px-6 py-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Payment Completed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UPIQRCode 