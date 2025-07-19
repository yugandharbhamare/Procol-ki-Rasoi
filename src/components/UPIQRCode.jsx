const UPIQRCode = ({ amount, orderId, onPaymentSuccess, onPaymentFailed }) => {
  const handleUPIAppOpen = () => {
    // UPI deep link format for opening UPI apps
    const upiUrl = `upi://pay?pa=Q629741098@ybl&pn=Procol%20ki%20Rasoi&am=${amount}&tn=Order%20${orderId}&cu=INR`
    
    // Try to open UPI app
    window.location.href = upiUrl
    
    // Fallback: Show instructions
    setTimeout(() => {
      alert('If UPI app didn\'t open automatically, please scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)')
    }, 1000)
  }

  return (
    <div className="text-center">
      <div className="bg-gray-100 rounded-lg p-6 mb-4 inline-block">
        <div className="w-48 h-48 bg-white rounded-lg p-4 border-2 border-gray-300">
          <img 
            src="/qr-code-placeholder.svg" 
            alt="UPI QR Code" 
            className="w-full h-full"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          {/* Fallback if image doesn't load */}
          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center hidden">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded mx-auto mb-2 flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">QR Code</span>
                </div>
                <div className="absolute bottom-1 right-1 bg-white rounded p-1">
                  <div className="text-xs font-bold text-green-600">UPI</div>
                </div>
              </div>
              <p className="text-xs text-gray-600">Scan with any UPI app</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Amount to pay: <span className="font-semibold text-gray-900">₹{amount}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            UPI ID: <span className="font-semibold text-gray-900">Q629741098@ybl</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Order ID: {orderId}</p>
        </div>
        
        <button
          onClick={handleUPIAppOpen}
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
        >
          Open UPI App
        </button>
        
        <div className="flex space-x-2 justify-center">
          <button
            onClick={onPaymentSuccess}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
          >
            Payment Successful
          </button>
          <button
            onClick={onPaymentFailed}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
          >
            Payment Failed
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Instructions:</strong><br/>
            1. Scan the QR code with any UPI app<br/>
            2. Verify the amount and merchant details<br/>
            3. Complete the payment<br/>
            4. Click "Payment Successful" when done
          </p>
        </div>
      </div>
    </div>
  )
}

export default UPIQRCode 