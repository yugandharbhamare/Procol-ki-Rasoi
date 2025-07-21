// Payment Service for UPI payments with automatic confirmation
// This service handles payment processing, webhook verification, and receipt generation
import Logger from '../utils/logger';
import { addOrderToGoogleSheets } from './googleSheetsService';

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
    Logger.debug('Processing webhook with data:', webhookData)
    
    // Verify webhook signature (implement based on your gateway)
    // const isValidSignature = verifyWebhookSignature(webhookData, PAYMENT_CONFIG.webhookSecret)
    // if (!isValidSignature) throw new Error('Invalid webhook signature')
    
    const { orderId, status, transactionId, amount, paymentMethod } = webhookData
    
    Logger.debug('Webhook details - OrderId:', orderId, 'Status:', status, 'Amount:', amount)
    
    if (status === 'success') {
      // Payment successful - trigger receipt generation
      Logger.debug('Payment successful, calling handlePaymentSuccess...')
      const result = await handlePaymentSuccess(orderId, {
        transactionId,
        amount,
        paymentMethod,
        timestamp: new Date().toISOString()
      })
      Logger.debug('handlePaymentSuccess result:', result)
      return result
    } else if (status === 'failed') {
      // Payment failed
      Logger.debug('Payment failed, calling handlePaymentFailure...')
      const result = await handlePaymentFailure(orderId, webhookData)
      Logger.debug('handlePaymentFailure result:', result)
      return result
    }
    
    return { success: true }
  } catch (error) {
    Logger.error('Webhook processing error:', error)
    return { success: false, error: error.message }
  }
}

// Initialize payment
export const initializePayment = async (order) => {
  try {
    Logger.debug('Initializing payment for order:', order)
    
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
    
    Logger.debug('Payment data created:', paymentData)
    
    // Store payment data for tracking
    paymentStatuses.set(order.id, {
      status: 'pending',
      data: paymentData,
      timestamp: new Date().toISOString()
    })
    
    Logger.debug('Payment data stored. Total payments tracked:', paymentStatuses.size)
    
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
    Logger.error('Payment initialization error:', error)
    return { success: false, error: error.message }
  }
}

// Check payment status
export const checkPaymentStatus = async (orderId) => {
  try {
    const paymentInfo = paymentStatuses.get(orderId)
    if (!paymentInfo) {
      Logger.debug('Payment info not found for order:', orderId)
      return { success: false, error: 'Payment not found' }
    }
    
    Logger.debug('Payment status check for order:', orderId, 'Status:', paymentInfo.status)
    
    // In production, this would check with your payment gateway
    // const response = await fetch(`${PAYMENT_CONFIG.gatewayUrl}/payment-status/${orderId}`)
    // const status = await response.json()
    
    // Return current status from local storage
    return {
      success: true,
      status: paymentInfo.status,
      data: paymentInfo.data
    }
  } catch (error) {
    Logger.error('Payment status check error:', error)
    return { success: false, error: error.message }
  }
}

// Handle successful payment
const handlePaymentSuccess = async (orderId, paymentDetails) => {
  try {
    Logger.debug('Handling payment success for order:', orderId, 'with details:', paymentDetails)
    
    // Update payment status
    const paymentInfo = paymentStatuses.get(orderId)
    if (paymentInfo) {
      paymentInfo.status = 'success'
      paymentInfo.paymentDetails = paymentDetails
      paymentStatuses.set(orderId, paymentInfo)
      Logger.debug('Payment status updated to success')
    } else {
      Logger.error('Payment info not found for order:', orderId)
      return { success: false, error: 'Payment info not found' }
    }
    
    // Get the order data
    const orderData = paymentInfo?.data
    Logger.debug('Order data from payment info:', orderData)
    
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
      
      Logger.debug('Completed order created:', completedOrder)
      
      // Store in Google Sheets
      Logger.debug('Storing order in Google Sheets...')
      const sheetsResult = await storeOrderInGoogleSheets(completedOrder)
      Logger.debug('Google Sheets result:', sheetsResult)
      
      // Add to order context (this will also save to localStorage)
      Logger.debug('Adding order to context...')
      const contextResult = await addToOrderContext(completedOrder)
      Logger.debug('Context result:', contextResult)
      
      // Trigger receipt generation
      Logger.debug('Generating receipt...')
      const receiptResult = await generateReceipt(completedOrder)
      Logger.debug('Receipt result:', receiptResult)
    } else {
      Logger.error('Order data not found in payment info')
      return { success: false, error: 'Order data not found' }
    }
    
    return { success: true }
  } catch (error) {
    Logger.error('Payment success handling error:', error)
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
    Logger.error('Payment failure handling error:', error)
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
    const result = await addOrderToGoogleSheets(order)
    
    if (result.success) {
      Logger.debug('Order stored in Google Sheets:', result.message)
    } else {
      Logger.error('Failed to store order in Google Sheets:', result.error)
    }
    
    return result
  } catch (error) {
    Logger.error('Error storing order in Google Sheets:', error)
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
    
    Logger.debug('Order added to context:', order.id)
    return { success: true }
  } catch (error) {
    Logger.error('Error adding order to context:', error)
    return { success: false, error: error.message }
  }
}

// Generate receipt
const generateReceipt = async (order) => {
  try {
    Logger.debug('Generating receipt for order:', order.id)
    
    // Import receipt service
    const { generateReceiptImage } = await import('./receiptService')
    
    // Generate receipt image
    const receiptResult = await generateReceiptImage(order)
    
    if (receiptResult.success) {
      Logger.debug('Receipt generated successfully')
    } else {
      Logger.warn('Failed to generate receipt:', receiptResult.error)
    }
    
    return { 
      success: true,
      receiptGenerated: receiptResult.success
    }
  } catch (error) {
    Logger.error('Receipt generation error:', error)
    return { success: false, error: error.message }
  }
}

// Simulate payment confirmation (for real UPI payments)
export const simulatePaymentConfirmation = async (orderId) => {
  try {
    // Get the payment info to get the actual amount
    const paymentInfo = paymentStatuses.get(orderId)
    if (!paymentInfo) {
      Logger.error('Payment info not found for order:', orderId)
      return { success: false, error: 'Payment info not found' }
    }
    
    // Create webhook data with actual order amount for UPI payment confirmation
    const webhookData = {
      orderId,
      status: 'success',
      transactionId: `UPI_TXN_${Date.now()}`,
      amount: paymentInfo.data.amount, // Use actual order amount
      paymentMethod: 'UPI',
      timestamp: new Date().toISOString()
    }
    
    Logger.debug('Confirming UPI payment with data:', webhookData)
    
    // Process the webhook to complete the order
    const result = await handlePaymentWebhook(webhookData)
    
    if (result.success) {
      Logger.debug('UPI payment confirmed successfully, order processed')
    } else {
      Logger.error('Failed to confirm UPI payment:', result.error)
    }
    
    return result
  } catch (error) {
    Logger.error('UPI payment confirmation error:', error)
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