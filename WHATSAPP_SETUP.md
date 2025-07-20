# WhatsApp Business API Setup Guide

This guide explains how to set up WhatsApp Business API integration for sending order confirmations and receipts to specified mobile numbers.

## Overview

The WhatsApp integration automatically sends:
1. **Order Confirmation Message** - Text message with order details
2. **Receipt Image** - JPG image of the receipt

## Current Configuration

### Mobile Numbers Receiving Notifications
- `+919096909763`
- `+918130379391`

### Message Types Sent
1. **Order Confirmation**: Detailed text message with order information
2. **Receipt Image**: Professional receipt as JPG image

## Setup Instructions

### 1. WhatsApp Business API Account

1. **Create Meta Developer Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app or use existing app
   - Add WhatsApp Business API product

2. **Get WhatsApp Business Account**
   - Apply for WhatsApp Business API access
   - Complete business verification process
   - Get your Phone Number ID and Access Token

### 2. Update Configuration

Update the WhatsApp configuration in `src/services/whatsappService.js`:

```javascript
const WHATSAPP_CONFIG = {
  apiUrl: 'https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages',
  accessToken: 'your_whatsapp_access_token',
  phoneNumberId: 'your_phone_number_id'
};
```

### 3. Environment Variables

Add these to your `.env` file:

```env
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages
```

### 4. Update Mobile Numbers

To update the list of mobile numbers receiving notifications:

```javascript
import { updateOrderConfirmationNumbers } from './src/services/whatsappService';

// Update numbers
const newNumbers = [
  '+919096909763',
  '+918130379391',
  '+91XXXXXXXXXX' // Add new numbers
];

updateOrderConfirmationNumbers(newNumbers);
```

## Message Templates

### Order Confirmation Message
```
🍽️ Order Confirmation - Procol ki Rasoi

📋 Order ID: [ORDER_ID]
👤 Customer: [CUSTOMER_NAME]
📧 Email: [EMAIL]
📅 Date: [DATE]
⏰ Time: [TIME]

🛒 Order Items:
• [ITEM_NAME] × [QUANTITY] = ₹[PRICE]
...

💰 Total Amount: ₹[TOTAL]
💳 Payment Status: ✅ Paid
📱 Payment Method: UPI

🎉 Thank you for your order!
Your food will be prepared fresh and ready for pickup.

📍 Pickup Location: Procol ki Rasoi
📞 Contact: +91-XXXXXXXXXX

Order receipt attached below 📄
```

### Receipt Image Caption
```
📄 Receipt for Order [ORDER_ID]

👤 Customer: [CUSTOMER_NAME]
💰 Total: ₹[TOTAL]
📅 Date: [DATE]

Procol ki Rasoi 🍽️
```

## API Endpoints Used

### Send Text Message
```javascript
POST https://graph.facebook.com/v18.0/{phone-number-id}/messages
{
  "messaging_product": "whatsapp",
  "to": "phone_number",
  "type": "text",
  "text": { "body": "message" }
}
```

### Send Image
```javascript
POST https://graph.facebook.com/v18.0/{phone-number-id}/messages
{
  "messaging_product": "whatsapp",
  "to": "phone_number",
  "type": "image",
  "image": {
    "link": "image_url",
    "caption": "caption_text"
  }
}
```

## Receipt Generation

The receipt is generated as an HTML template and converted to JPG using html2canvas:

1. **HTML Template**: Professional receipt layout with restaurant branding
2. **Image Conversion**: HTML → Canvas → JPG blob
3. **Base64 Encoding**: For WhatsApp API compatibility
4. **WhatsApp Sending**: Image sent with caption

## Testing

### Development Mode
- Messages are logged to console (development only)
- No actual WhatsApp messages sent
- Receipt images generated but not sent

### Production Mode
- Real WhatsApp messages sent to configured numbers
- Receipt images sent as attachments
- Error handling and retry logic

## Error Handling

The service includes comprehensive error handling:

- **Network Errors**: Retry logic for failed API calls
- **Invalid Numbers**: Phone number validation and formatting
- **Image Generation**: Fallback for receipt generation failures
- **API Limits**: Rate limiting and quota management

## Monitoring

### Logs
- All WhatsApp activities logged via Logger utility
- Success/failure status for each message
- Number of recipients contacted

### Metrics
- Messages sent successfully
- Failed deliveries
- Response times
- API quota usage

## Security Considerations

1. **Access Token**: Store securely in environment variables
2. **Phone Numbers**: Validate and sanitize input
3. **API Limits**: Respect WhatsApp Business API rate limits
4. **Data Privacy**: Ensure compliance with data protection regulations

## Troubleshooting

### Common Issues

1. **Invalid Phone Number Format**
   - Ensure numbers include country code (+91 for India)
   - Remove spaces and special characters

2. **API Authentication Errors**
   - Verify access token is valid
   - Check phone number ID is correct

3. **Image Generation Failures**
   - Ensure html2canvas is properly installed
   - Check browser compatibility

4. **Message Delivery Failures**
   - Verify recipient numbers are valid
   - Check WhatsApp Business API status

### Debug Mode

Enable debug logging by setting environment variable:
```env
DEBUG_WHATSAPP=true
```

## Support

For WhatsApp Business API issues:
- [Meta Developer Documentation](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Business API Support](https://developers.facebook.com/support/)

For application-specific issues:
- Check application logs
- Verify configuration settings
- Test with development mode first 