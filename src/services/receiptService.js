// Receipt Service for generating receipt images
import Logger from '../utils/logger';

// Generate receipt as HTML and convert to image
export const generateReceiptImage = async (order) => {
  try {
    Logger.debug('Generating receipt image for order:', order.id);
    
    // Create receipt HTML
    const receiptHTML = generateReceiptHTML(order);
    
    // Convert HTML to image using html2canvas or similar
    const imageBlob = await htmlToImage(receiptHTML);
    
    // Convert blob to base64 for WhatsApp sharing
    const base64Image = await blobToBase64(imageBlob);
    
    Logger.debug('Receipt image generated successfully');
    
    return {
      success: true,
      imageUrl: base64Image,
      imageBlob: imageBlob
    };
    
  } catch (error) {
    Logger.error('Error generating receipt image:', error);
    return { success: false, error: error.message };
  }
};

// Generate receipt HTML
const generateReceiptHTML = (order) => {
  const items = Object.values(order.items).map(item => 
    `<tr>
      <td class="item-name">${item.name}</td>
      <td class="item-quantity">${item.quantity}</td>
      <td class="item-price">₹${item.price.toFixed(2)}</td>
      <td class="item-total">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - Order ${order.id}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          width: 400px;
        }
        .receipt {
          border: 2px solid #333;
          border-radius: 10px;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .restaurant-name {
          font-size: 24px;
          font-weight: bold;
          color: #e67e22;
          margin-bottom: 5px;
        }
        .tagline {
          font-size: 12px;
          color: #666;
        }
        .order-info {
          margin-bottom: 20px;
        }
        .order-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 14px;
        }
        .order-label {
          font-weight: bold;
          color: #333;
        }
        .order-value {
          color: #666;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background: #f8f9fa;
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
          font-weight: bold;
        }
        .items-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
          font-size: 12px;
        }
        .item-name {
          width: 40%;
        }
        .item-quantity {
          width: 15%;
          text-align: center;
        }
        .item-price {
          width: 20%;
          text-align: right;
        }
        .item-total {
          width: 25%;
          text-align: right;
          font-weight: bold;
        }
        .total-section {
          border-top: 2px solid #333;
          padding-top: 15px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 16px;
        }
        .grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #e67e22;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        .payment-info {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="restaurant-name">Procol ki Rasoi</div>
          <div class="tagline">Fresh Food, Great Taste</div>
        </div>
        
        <div class="order-info">
          <div class="order-row">
            <span class="order-label">Order ID:</span>
            <span class="order-value">${order.id}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Date:</span>
            <span class="order-value">${new Date(order.timestamp).toLocaleDateString()}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Time:</span>
            <span class="order-value">${new Date(order.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Customer:</span>
            <span class="order-value">${order.user.displayName || `${order.user.firstName} ${order.user.lastName}`}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Email:</span>
            <span class="order-value">${order.user.email}</span>
          </div>
        </div>
        
        <div class="payment-info">
          <div class="payment-row">
            <span class="order-label">Payment Status:</span>
            <span class="order-value">✅ Paid</span>
          </div>
          <div class="payment-row">
            <span class="order-label">Payment Method:</span>
            <span class="order-value">${order.paymentDetails?.paymentMethod || 'UPI'}</span>
          </div>
          ${order.paymentDetails?.transactionId ? `
          <div class="payment-row">
            <span class="order-label">Transaction ID:</span>
            <span class="order-value">${order.paymentDetails.transactionId}</span>
          </div>
          ` : ''}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row grand-total">
            <span>Total Amount:</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div>Thank you for your order!</div>
          <div>Your food will be prepared fresh</div>
          <div style="margin-top: 10px;">
            <strong>Pickup Location:</strong> Procol ki Rasoi<br>
            <strong>Contact:</strong> +91-XXXXXXXXXX
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

// Convert HTML to image using html2canvas
const htmlToImage = async (html) => {
  try {
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);
    
    // Use html2canvas to convert to image
    const canvas = await import('html2canvas').then(module => 
      module.default(container, {
        width: 400,
        height: 600,
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      })
    );
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
    
  } catch (error) {
    Logger.error('Error converting HTML to image:', error);
    throw error;
  }
};

// Convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Generate and send receipt via WhatsApp
export const generateAndSendReceipt = async (order) => {
  try {
    Logger.debug('Generating and sending receipt for order:', order.id);
    
    // Generate receipt image
    const imageResult = await generateReceiptImage(order);
    
    if (!imageResult.success) {
      throw new Error(imageResult.error);
    }
    
    // Import WhatsApp service
    const { sendReceiptImage } = await import('./whatsappService');
    
    // Send receipt image via WhatsApp
    const whatsappResult = await sendReceiptImage(order, imageResult.imageUrl);
    
    if (whatsappResult.success) {
      Logger.debug('Receipt sent via WhatsApp successfully');
    } else {
      Logger.warn('Failed to send receipt via WhatsApp:', whatsappResult.error);
    }
    
    return {
      success: true,
      imageGenerated: imageResult.success,
      whatsappSent: whatsappResult.success,
      imageUrl: imageResult.imageUrl
    };
    
  } catch (error) {
    Logger.error('Error generating and sending receipt:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generateReceiptImage,
  generateAndSendReceipt
}; 