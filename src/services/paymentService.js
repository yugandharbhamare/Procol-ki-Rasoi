// Payment Service for UPI payments with automatic confirmation
// This service handles payment processing, webhook verification, and receipt generation

// Payment Gateway Configuration
const PAYMENT_CONFIG = {
  // For demo purposes, we'll simulate payment confirmation
  // In production, this would be your actual payment gateway credentials
  gatewayUrl: 'https://api.payment-gateway.com', // Replace with actual gateway
  merchantId: 'your_merchant_id',
  apiKey: 'your_api_key',
  webhookSecret: 'your_webhook_secret'
}

// Payment status tracking
const paymentStatuses = new Map()

// Webhook endpoint for payment confirmation
export const handlePaymentWebhook = async (webhookData) => {
  try {
    console.log('Processing webhook with data:', webhookData)
    
    // Verify webhook signature (implement based on your gateway)
    // const isValidSignature = verifyWebhookSignature(webhookData, PAYMENT_CONFIG.webhookSecret)
    // if (!isValidSignature) throw new Error('Invalid webhook signature')
    
    const { orderId, status, transactionId, amount, paymentMethod } = webhookData
    
    console.log('Webhook details - OrderId:', orderId, 'Status:', status, 'Amount:', amount)
    
    if (status === 'success') {
      // Payment successful - trigger receipt generation
      console.log('Payment successful, calling handlePaymentSuccess...')
      const result = await handlePaymentSuccess(orderId, {
        transactionId,
        amount,
        paymentMethod,
        timestamp: new Date().toISOString()
      })
      console.log('handlePaymentSuccess result:', result)
      return result
    } else if (status === 'failed') {
      // Payment failed
      console.log('Payment failed, calling handlePaymentFailure...')
      const result = await handlePaymentFailure(orderId, webhookData)
      console.log('handlePaymentFailure result:', result)
      return result
    }
    
    return { success: true }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return { success: false, error: error.message }
  }
}

// Initialize payment
export const initializePayment = async (order) => {
  try {
    console.log('Initializing payment for order:', order)
    
    const paymentData = {
      orderId: order.id,
      amount: calculateTotal(order.items),
      currency: 'INR',
      customerEmail: order.user.email,
      customerName: order.user.displayName || `${order.user.firstName} ${order.user.lastName}`,
      items: Object.values(order.items).map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    }
    
    console.log('Payment data created:', paymentData)
    
    // Store payment data for tracking
    paymentStatuses.set(order.id, {
      status: 'pending',
      data: paymentData,
      timestamp: new Date().toISOString()
    })
    
    console.log('Payment data stored. Total payments tracked:', paymentStatuses.size)
    
    // In production, this would make an API call to your payment gateway
    // const response = await fetch(`${PAYMENT_CONFIG.gatewayUrl}/initiate-payment`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${PAYMENT_CONFIG.apiKey}`
    //   },
    //   body: JSON.stringify(paymentData)
    // })
    
    // For demo, return simulated payment data
    return {
      success: true,
      paymentId: `pay_${Date.now()}`,
      qrCode: generateUPIQRCode(paymentData),
      upiId: 'Q629741098@ybl',
      amount: paymentData.amount
    }
  } catch (error) {
    console.error('Payment initialization error:', error)
    return { success: false, error: error.message }
  }
}

// Check payment status
export const checkPaymentStatus = async (orderId) => {
  try {
    const paymentInfo = paymentStatuses.get(orderId)
    if (!paymentInfo) {
      return { success: false, error: 'Payment not found' }
    }
    
    // In production, this would check with your payment gateway
    // const response = await fetch(`${PAYMENT_CONFIG.gatewayUrl}/payment-status/${orderId}`)
    // const status = await response.json()
    
    // For demo, simulate status check
    return {
      success: true,
      status: paymentInfo.status,
      data: paymentInfo.data
    }
  } catch (error) {
    console.error('Payment status check error:', error)
    return { success: false, error: error.message }
  }
}

// Handle successful payment
const handlePaymentSuccess = async (orderId, paymentDetails) => {
  try {
    console.log('Handling payment success for order:', orderId, 'with details:', paymentDetails)
    
    // Update payment status
    const paymentInfo = paymentStatuses.get(orderId)
    if (paymentInfo) {
      paymentInfo.status = 'success'
      paymentInfo.paymentDetails = paymentDetails
      paymentStatuses.set(orderId, paymentInfo)
      console.log('Payment status updated to success')
    } else {
      console.error('Payment info not found for order:', orderId)
      return { success: false, error: 'Payment info not found' }
    }
    
    // Get the order data
    const orderData = paymentInfo?.data
    console.log('Order data from payment info:', orderData)
    
    if (orderData) {
      // Create completed order with payment details
      const completedOrder = {
        ...orderData,
        id: orderId,
        timestamp: paymentDetails.timestamp,
        user: {
          email: orderData.customerEmail,
          displayName: orderData.customerName,
          firstName: orderData.customerName.split(' ')[0],
          lastName: orderData.customerName.split(' ').slice(1).join(' ')
        },
        items: orderData.items.reduce((acc, item) => {
          acc[item.id || `item_${Date.now()}`] = {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: '🍽️' // Default image
          }
          return acc
        }, {}),
        total: paymentDetails.amount,
        paymentDetails: {
          transactionId: paymentDetails.transactionId,
          paymentMethod: paymentDetails.paymentMethod,
          amount: paymentDetails.amount,
          status: 'success'
        }
      }
      
      console.log('Completed order created:', completedOrder)
      
      // Store in Google Sheets
      console.log('Storing order in Google Sheets...')
      const sheetsResult = await storeOrderInGoogleSheets(completedOrder)
      console.log('Google Sheets result:', sheetsResult)
      
      // Add to order context (this will also save to localStorage)
      console.log('Adding order to context...')
      const contextResult = await addToOrderContext(completedOrder)
      console.log('Context result:', contextResult)
      
      // Trigger receipt generation
      console.log('Generating receipt...')
      const receiptResult = await generateReceipt(completedOrder)
      console.log('Receipt result:', receiptResult)
    } else {
      console.error('Order data not found in payment info')
      return { success: false, error: 'Order data not found' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Payment success handling error:', error)
    return { success: false, error: error.message }
  }
}

// Handle failed payment
const handlePaymentFailure = async (orderId, failureDetails) => {
  try {
    // Update payment status
    const paymentInfo = paymentStatuses.get(orderId)
    if (paymentInfo) {
      paymentInfo.status = 'failed'
      paymentInfo.failureDetails = failureDetails
      paymentStatuses.set(orderId, paymentInfo)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Payment failure handling error:', error)
    return { success: false, error: error.message }
  }
}

// Generate UPI QR Code
const generateUPIQRCode = (paymentData) => {
  const upiUrl = `upi://pay?pa=Q629741098@ybl&pn=Procol%20ki%20Rasoi&am=${paymentData.amount}&tn=Order%20${paymentData.orderId}&cu=INR`
  return upiUrl
}

// Calculate total amount
const calculateTotal = (items) => {
  return Object.values(items).reduce((total, item) => {
    if (typeof item.price === 'number') {
      return total + (item.price * item.quantity)
    }
    return total
  }, 0)
}

// Store order in Google Sheets
const storeOrderInGoogleSheets = async (order) => {
  try {
    // Import the Google Sheets service
    const { addOrderToGoogleSheets } = await import('./googleSheetsService')
    const result = await addOrderToGoogleSheets(order)
    
    if (result.success) {
      console.log('Order stored in Google Sheets:', result.message)
    } else {
      console.error('Failed to store order in Google Sheets:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('Error storing order in Google Sheets:', error)
    return { success: false, error: error.message }
  }
}

// Add order to OrderContext
const addToOrderContext = async (order) => {
  try {
    // Get existing orders from localStorage
    const existingOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]')
    
    // Add new order to the beginning
    const updatedOrders = [order, ...existingOrders]
    
    // Save back to localStorage
    localStorage.setItem('completedOrders', JSON.stringify(updatedOrders))
    
    console.log('Order added to context:', order.id)
    return { success: true }
  } catch (error) {
    console.error('Error adding order to context:', error)
    return { success: false, error: error.message }
  }
}

// Generate receipt
const generateReceipt = async (order) => {
  try {
    // This would typically trigger receipt generation
    // For now, we'll just log the receipt data
    console.log('Receipt generated for order:', order.id)
    
    // In production, you might:
    // 1. Send email receipt
    // 2. Generate PDF receipt
    // 3. Store receipt in database
    // 4. Trigger notifications
    
    return { success: true }
  } catch (error) {
    console.error('Receipt generation error:', error)
    return { success: false, error: error.message }
  }
}

// Simulate payment confirmation (for demo purposes)
export const simulatePaymentConfirmation = async (orderId) => {
  try {
    // Get the payment info to get the actual amount
    const paymentInfo = paymentStatuses.get(orderId)
    if (!paymentInfo) {
      console.error('Payment info not found for order:', orderId)
      return { success: false, error: 'Payment info not found' }
    }
    
    // Simulate webhook data with actual order amount
    const webhookData = {
      orderId,
      status: 'success',
      transactionId: `txn_${Date.now()}`,
      amount: paymentInfo.data.amount, // Use actual order amount
      paymentMethod: 'UPI',
      timestamp: new Date().toISOString()
    }
    
    console.log('Simulating payment confirmation with data:', webhookData)
    
    // Process the webhook
    return await handlePaymentWebhook(webhookData)
  } catch (error) {
    console.error('Payment simulation error:', error)
    return { success: false, error: error.message }
  }
}

// Get payment status for an order
export const getPaymentStatus = (orderId) => {
  return paymentStatuses.get(orderId) || null
}

// Clear payment data (for cleanup)
export const clearPaymentData = (orderId) => {
  paymentStatuses.delete(orderId)
} 