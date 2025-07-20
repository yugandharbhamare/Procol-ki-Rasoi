// WhatsApp Service for sending order confirmations and receipts
import Logger from '../utils/logger';

// WhatsApp Business API Configuration
const WHATSAPP_CONFIG = {
  // For demo purposes, we'll simulate WhatsApp sending
  // In production, this would be your actual WhatsApp Business API credentials
  apiUrl: import.meta.env.VITE_WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages',
  accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || 'your_whatsapp_access_token',
  phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || 'your_phone_number_id'
};

// List of mobile numbers to receive order confirmations
const ORDER_CONFIRMATION_NUMBERS = [
  '+919096909763',
  '+918130379391'
];

// Format phone number for WhatsApp API (remove + and add country code)
const formatPhoneNumber = (phoneNumber) => {
  // Remove + and any spaces
  let cleaned = phoneNumber.replace(/[+\s]/g, '');
  
  // Ensure it starts with country code
  if (cleaned.startsWith('91')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '91' + cleaned.substring(1);
  } else {
    return '91' + cleaned;
  }
};

// Send text message via WhatsApp
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    Logger.debug('Sending WhatsApp message to:', formattedNumber);
    Logger.debug('Message:', message);
    
    // In production, this would make an API call to WhatsApp Business API
    // const response = await fetch(WHATSAPP_CONFIG.apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: formattedNumber,
    //     type: 'text',
    //     text: { body: message }
    //   })
    // });
    
    // For demo, simulate successful sending
    Logger.debug('WhatsApp message sent successfully to:', formattedNumber);
    return { success: true, messageId: `msg_${Date.now()}` };
    
  } catch (error) {
    Logger.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};

// Send image via WhatsApp
export const sendWhatsAppImage = async (phoneNumber, imageUrl, caption = '') => {
  try {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    Logger.debug('Sending WhatsApp image to:', formattedNumber);
    Logger.debug('Image URL:', imageUrl);
    Logger.debug('Caption:', caption);
    
    // In production, this would make an API call to WhatsApp Business API
    // const response = await fetch(WHATSAPP_CONFIG.apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: formattedNumber,
    //     type: 'image',
    //     image: {
    //       link: imageUrl,
    //       caption: caption
    //     }
    //   })
    // });
    
    // For demo, simulate successful sending
    Logger.debug('WhatsApp image sent successfully to:', formattedNumber);
    return { success: true, messageId: `img_${Date.now()}` };
    
  } catch (error) {
    Logger.error('Error sending WhatsApp image:', error);
    return { success: false, error: error.message };
  }
};

// Generate order confirmation message
const generateOrderConfirmationMessage = (order) => {
  const items = Object.values(order.items).map(item => 
    `• ${item.name} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');
  
  const message = `🍽️ *Order Confirmation - Procol ki Rasoi*

📋 *Order ID:* ${order.id}
👤 *Customer:* ${order.user.displayName || `${order.user.firstName} ${order.user.lastName}`}
📧 *Email:* ${order.user.email}
📅 *Date:* ${new Date(order.timestamp).toLocaleDateString()}
⏰ *Time:* ${new Date(order.timestamp).toLocaleTimeString()}

🛒 *Order Items:*
${items}

💰 *Total Amount:* ₹${order.total.toFixed(2)}
💳 *Payment Status:* ✅ Paid
📱 *Payment Method:* ${order.paymentDetails?.paymentMethod || 'UPI'}

🎉 *Thank you for your order!*
Your food will be prepared fresh and ready for pickup.

📍 *Pickup Location:* Procol ki Rasoi
📞 *Contact:* +91-XXXXXXXXXX

*Order receipt attached below* 📄`;

  return message;
};

// Send order confirmation to all registered numbers
export const sendOrderConfirmation = async (order) => {
  try {
    Logger.debug('Sending order confirmation to WhatsApp numbers:', ORDER_CONFIRMATION_NUMBERS);
    
    const confirmationMessage = generateOrderConfirmationMessage(order);
    
    // Send text message to all numbers
    const messagePromises = ORDER_CONFIRMATION_NUMBERS.map(phoneNumber =>
      sendWhatsAppMessage(phoneNumber, confirmationMessage)
    );
    
    const messageResults = await Promise.all(messagePromises);
    
    // Check if all messages were sent successfully
    const allSuccessful = messageResults.every(result => result.success);
    
    if (allSuccessful) {
      Logger.debug('Order confirmation sent to all WhatsApp numbers successfully');
    } else {
      Logger.warn('Some WhatsApp messages failed to send:', messageResults);
    }
    
    return {
      success: allSuccessful,
      results: messageResults,
      numbersContacted: ORDER_CONFIRMATION_NUMBERS.length
    };
    
  } catch (error) {
    Logger.error('Error sending order confirmation:', error);
    return { success: false, error: error.message };
  }
};

// Send receipt image to all registered numbers
export const sendReceiptImage = async (order, receiptImageUrl) => {
  try {
    Logger.debug('Sending receipt image to WhatsApp numbers:', ORDER_CONFIRMATION_NUMBERS);
    
    const caption = `📄 *Receipt for Order ${order.id}*

👤 *Customer:* ${order.user.displayName || `${order.user.firstName} ${order.user.lastName}`}
💰 *Total:* ₹${order.total.toFixed(2)}
📅 *Date:* ${new Date(order.timestamp).toLocaleDateString()}

*Procol ki Rasoi* 🍽️`;
    
    // Send image to all numbers
    const imagePromises = ORDER_CONFIRMATION_NUMBERS.map(phoneNumber =>
      sendWhatsAppImage(phoneNumber, receiptImageUrl, caption)
    );
    
    const imageResults = await Promise.all(imagePromises);
    
    // Check if all images were sent successfully
    const allSuccessful = imageResults.every(result => result.success);
    
    if (allSuccessful) {
      Logger.debug('Receipt images sent to all WhatsApp numbers successfully');
    } else {
      Logger.warn('Some WhatsApp images failed to send:', imageResults);
    }
    
    return {
      success: allSuccessful,
      results: imageResults,
      numbersContacted: ORDER_CONFIRMATION_NUMBERS.length
    };
    
  } catch (error) {
    Logger.error('Error sending receipt image:', error);
    return { success: false, error: error.message };
  }
};

// Update the list of mobile numbers (for admin use)
export const updateOrderConfirmationNumbers = (newNumbers) => {
  if (Array.isArray(newNumbers) && newNumbers.length > 0) {
    ORDER_CONFIRMATION_NUMBERS.length = 0;
    ORDER_CONFIRMATION_NUMBERS.push(...newNumbers);
    Logger.debug('Updated order confirmation numbers:', ORDER_CONFIRMATION_NUMBERS);
    return { success: true, message: 'Numbers updated successfully' };
  }
  return { success: false, error: 'Invalid numbers array' };
};

// Get current list of mobile numbers
export const getOrderConfirmationNumbers = () => {
  return [...ORDER_CONFIRMATION_NUMBERS];
};

export default {
  sendOrderConfirmation,
  sendReceiptImage,
  updateOrderConfirmationNumbers,
  getOrderConfirmationNumbers
}; 