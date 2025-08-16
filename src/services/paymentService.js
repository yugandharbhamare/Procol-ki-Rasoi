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
    console.log('PaymentService: Processing webhook with data:', webhookData)
    
    // Verify webhook signature (implement based on your gateway)
    // const isValidSignature = verifyWebhookSignature(webhookData, PAYMENT_CONFIG.webhookSecret)
    // if (!isValidSignature) throw new Error('Invalid webhook signature')
    
    const { orderId, status, transactionId, amount, paymentMethod } = webhookData
    
    console.log('PaymentService: Webhook details - OrderId:', orderId, 'Status:', status, 'Amount:', amount)
    
    if (status === 'success') {
      // Payment successful - trigger receipt generation
      console.log('PaymentService: Payment successful, calling handlePaymentSuccess...')
      const result = await handlePaymentSuccess(orderId, {
        transactionId,
        amount,
        paymentMethod,
        timestamp: new Date().toISOString()
      })
      console.log('PaymentService: handlePaymentSuccess result:', result)
      return result
    } else if (status === 'failed') {
      // Payment failed
      console.log('PaymentService: Payment failed, calling handlePaymentFailure...')
      const result = await handlePaymentFailure(orderId, webhookData)
      console.log('PaymentService: handlePaymentFailure result:', result)
      return result
    }
    
    return { success: true }
  } catch (error) {
    console.error('PaymentService: Webhook processing error:', error)
    return { success: false, error: error.message }
  }
}

// Initialize payment
export const initializePayment = async (order) => {
  try {
    console.log('PaymentService: Initializing payment for order:', order)
    
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
    
    console.log('PaymentService: Payment data created:', paymentData)
    
    // Store payment data for tracking
    paymentStatuses.set(order.id, {
      status: 'pending',
      data: paymentData,
      timestamp: new Date().toISOString()
    })
    
    console.log('PaymentService: Payment data stored. Total payments tracked:', paymentStatuses.size)
    console.log('PaymentService: Payment statuses map:', Array.from(paymentStatuses.entries()))
    
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
    console.log('PaymentService: Handling payment success for order:', orderId, 'with details:', paymentDetails)
    
    // Update payment status
    const paymentInfo = paymentStatuses.get(orderId)
    if (paymentInfo) {
      paymentInfo.status = 'success'
      paymentInfo.paymentDetails = paymentDetails
      paymentStatuses.set(orderId, paymentInfo)
      console.log('PaymentService: Payment status updated to success')
    } else {
      console.error('PaymentService: Payment info not found for order:', orderId)
      return { success: false, error: 'Payment info not found' }
    }
    
    // Get the order data
    const orderData = paymentInfo?.data
    console.log('PaymentService: Order data from payment info:', orderData)
    
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
      
      console.log('PaymentService: Completed order created:', completedOrder)
      
      // Store in Google Sheets
      console.log('PaymentService: Storing order in Google Sheets...')
      const sheetsResult = await storeOrderInGoogleSheets(completedOrder)
      console.log('PaymentService: Google Sheets result:', sheetsResult)
      
      // Add to order context (this will also save to localStorage)
      console.log('PaymentService: Adding order to context...')
      const contextResult = await addToOrderContext(completedOrder)
      console.log('PaymentService: Context result:', contextResult)
      
      // Trigger receipt generation
      console.log('PaymentService: Generating receipt...')
      const receiptResult = await generateReceipt(completedOrder)
      console.log('PaymentService: Receipt result:', receiptResult)
    } else {
      console.error('PaymentService: Order data not found in payment info')
      return { success: false, error: 'Order data not found' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('PaymentService: Payment success handling error:', error)
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
    console.log('PaymentService: addToOrderContext called with order:', order);
    
    // Get existing orders from localStorage
    const existingOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]')
    console.log('PaymentService: Existing orders from localStorage:', existingOrders);
    
    // Add new order to the beginning
    const updatedOrders = [order, ...existingOrders]
    console.log('PaymentService: Updated orders array:', updatedOrders);
    
    // Save back to localStorage
    localStorage.setItem('completedOrders', JSON.stringify(updatedOrders))
    console.log('PaymentService: Order saved to localStorage');
    
    // Also create order in Supabase for staff portal
    try {
      console.log('PaymentService: Attempting to create order in Supabase...');
      const { createOrder } = await import('./supabaseService')
      console.log('PaymentService: Supabase service imported successfully');
      
      // Get current user from localStorage or context
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      console.log('PaymentService: Current user:', currentUser);
      
      // Convert order items from object to array format for Supabase
      const orderItems = Object.values(order.items || {}).map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      console.log('PaymentService: Converted order items:', orderItems);
      
      const orderData = {
        user_id: currentUser.uid || null,
        order_amount: order.total || 0,
        status: 'pending', // Start as pending for staff approval
        items: orderItems // Include items for order creation
      };
      console.log('PaymentService: Order data prepared for Supabase:', orderData);
      
      const supabaseResult = await createOrder(orderData)
      console.log('PaymentService: Supabase createOrder result:', supabaseResult);
      
      if (supabaseResult.success) {
        console.log('PaymentService: Order successfully created in Supabase for staff portal:', supabaseResult.order.id)
      } else {
        console.error('PaymentService: Failed to create order in Supabase for staff portal:', supabaseResult.error)
      }
    } catch (supabaseError) {
      console.error('PaymentService: Error creating order in Supabase for staff portal:', supabaseError)
      console.error('PaymentService: Supabase error details:', {
        message: supabaseError.message,
        stack: supabaseError.stack,
        name: supabaseError.name
      });
    }
    
    console.log('PaymentService: Order added to context successfully:', order.id)
    return { success: true }
  } catch (error) {
    console.error('PaymentService: Error adding order to context:', error)
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
    console.log('PaymentService: Simulating payment confirmation for order:', orderId);
    
    // Get the payment info to get the actual amount
    const paymentInfo = paymentStatuses.get(orderId)
    if (!paymentInfo) {
      console.error('PaymentService: Payment info not found for order:', orderId)
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
    
    console.log('PaymentService: Confirming UPI payment with data:', webhookData)
    
    // Process the webhook to complete the order
    const result = await handlePaymentWebhook(webhookData)
    
    if (result.success) {
      console.log('PaymentService: UPI payment confirmed successfully, order processed')
    } else {
      console.error('PaymentService: Failed to confirm UPI payment:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('PaymentService: UPI payment confirmation error:', error)
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