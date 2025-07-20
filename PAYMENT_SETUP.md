# UPI Payment Integration Setup

This document explains the UPI payment integration with automatic payment confirmation and receipt generation.

## Overview

The payment system now includes:
- **Automatic Payment Confirmation**: No manual "Payment Completed" button
- **Webhook Integration**: Real-time payment status updates
- **Automatic Receipt Generation**: Receipts generated only after successful payment
- **Google Sheets Integration**: Orders automatically stored in Google Sheets after payment confirmation

## Payment Flow

### 1. Order Placement
1. User adds items to cart
2. Clicks "Place Order"
3. Payment screen opens with UPI options

### 2. Payment Initiation
1. Payment is initialized with payment gateway
2. QR code is generated with order details
3. User scans QR code or uses UPI app

### 3. Payment Confirmation
1. Payment gateway sends webhook to your server
2. Server verifies payment and updates order status
3. Order is automatically added to Google Sheets
4. Receipt is generated and shown to user

### 4. Receipt Generation
1. Only occurs after successful payment confirmation
2. Order data is stored in Google Sheets
3. Receipt shows payment details and transaction ID

## Current Implementation (Demo Mode)

### Features:
- **Real UPI Payment Gateway**: Integrates with actual payment gateways
- **Automatic Status Monitoring**: Checks payment status every 3 seconds
- **QR Code Payment**: Users scan QR code with UPI apps
- **Webhook Integration**: Real payment confirmation via webhooks

### Testing:
1. Place an order and go to payment screen
2. Scan QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
3. Complete payment in your UPI app
4. Payment will be automatically confirmed via webhook
5. Receipt will be generated and order stored in Google Sheets

## Production Setup

### 1. Payment Gateway Integration

Choose a UPI payment gateway (e.g., Razorpay, PayU, PhonePe):

```javascript
// Example with Razorpay
const PAYMENT_CONFIG = {
  gatewayUrl: 'https://api.razorpay.com/v1',
  keyId: 'your_razorpay_key_id',
  keySecret: 'your_razorpay_key_secret',
  webhookSecret: 'your_webhook_secret'
}
```

### 2. Backend Webhook Endpoint

Create a webhook endpoint to handle payment confirmations:

```javascript
// Express.js example
app.post('/api/payment/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature']
    const isValid = verifyWebhookSignature(req.body, signature, PAYMENT_CONFIG.webhookSecret)
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' })
    }
    
    // Process payment confirmation
    const { orderId, status, transactionId } = req.body.payload.payment.entity
    
    if (status === 'captured') {
      // Payment successful
      await handlePaymentSuccess(orderId, {
        transactionId,
        amount: req.body.payload.payment.entity.amount / 100, // Convert from paise
        paymentMethod: 'UPI',
        timestamp: new Date().toISOString()
      })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})
```

### 3. Frontend Integration

Update the payment service with your gateway credentials:

```javascript
// In src/services/paymentService.js
const PAYMENT_CONFIG = {
  gatewayUrl: 'https://api.your-gateway.com',
  merchantId: 'your_merchant_id',
  apiKey: 'your_api_key',
  webhookSecret: 'your_webhook_secret'
}

// Update initializePayment function
export const initializePayment = async (order) => {
  try {
    const response = await fetch(`${PAYMENT_CONFIG.gatewayUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYMENT_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        amount: calculateTotal(order.items) * 100, // Convert to paise
        currency: 'INR',
        receipt: order.id,
        notes: {
          customer_email: order.user.email,
          customer_name: order.user.displayName
        }
      })
    })
    
    const result = await response.json()
    return {
      success: true,
      paymentId: result.id,
      qrCode: result.qr_code,
      upiId: result.upi_id,
      amount: result.amount / 100
    }
  } catch (error) {
    console.error('Payment initialization error:', error)
    return { success: false, error: error.message }
  }
}
```

### 4. Environment Variables

Add to your `.env` file:

```bash
# Payment Gateway
PAYMENT_GATEWAY_URL=https://api.your-gateway.com
PAYMENT_GATEWAY_KEY_ID=your_key_id
PAYMENT_GATEWAY_KEY_SECRET=your_key_secret
PAYMENT_WEBHOOK_SECRET=your_webhook_secret

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1EC1_jaIll58v01Y_psLx2nLJLAb_yCl894aKeOsUurA
```

## Security Considerations

### 1. Webhook Verification
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement idempotency to prevent duplicate processing

### 2. Payment Data
- Never store sensitive payment data in frontend
- Use payment gateway's secure token system
- Implement proper error handling

### 3. Order Validation
- Verify order amounts match payment amounts
- Check order status before processing
- Implement timeout handling for pending payments

## Testing

### Development Testing:
1. Use a real UPI app to scan the QR code
2. Check browser console for payment logs
3. Verify orders appear in Google Sheets
4. Test order history filtering

### Production Testing:
1. Use payment gateway's test mode
2. Test webhook endpoints with test data
3. Verify payment confirmation flow
4. Test error scenarios

## Error Handling

### Common Issues:
1. **Webhook Not Received**: Check webhook URL and signature
2. **Payment Not Confirmed**: Verify payment gateway integration
3. **Order Not Saved**: Check Google Sheets permissions
4. **Receipt Not Generated**: Verify payment status

### Debug Commands:
```javascript
// Check payment status
console.log(getPaymentStatus('order_id'))

// Check pending payments
console.log(paymentStatuses)

// Clear payment data
clearPaymentData('order_id')
```

## Monitoring

### Key Metrics:
- Payment success rate
- Webhook delivery success
- Order processing time
- Error rates

### Logging:
- Payment initiation
- Webhook reception
- Payment confirmation
- Order storage
- Receipt generation

## Future Enhancements

1. **Email Receipts**: Send receipts via email
2. **SMS Notifications**: Send payment confirmations via SMS
3. **Payment Analytics**: Track payment patterns
4. **Refund Handling**: Implement refund processing
5. **Multiple Payment Methods**: Add card payments
6. **Subscription Payments**: Support recurring payments 