// Utility functions for order ID handling

/**
 * Check if an order ID is a custom order ID (starts with ORD)
 * @param {string} orderId - The order ID to check
 * @returns {boolean} - True if it's a custom order ID
 */
export const isCustomOrderId = (orderId) => {
  return orderId && typeof orderId === 'string' && orderId.startsWith('ORD');
};

/**
 * Check if an order ID is a Supabase UUID
 * @param {string} orderId - The order ID to check
 * @returns {boolean} - True if it's a Supabase UUID
 */
export const isSupabaseUUID = (orderId) => {
  return orderId && typeof orderId === 'string' && 
         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
};

/**
 * Get the display order ID (prefer custom, fallback to UUID)
 * @param {Object} order - The order object
 * @returns {string} - The display order ID
 */
export const getDisplayOrderId = (order) => {
  return order.custom_order_id || order.id || 'Unknown';
};

/**
 * Get the database order ID (prefer UUID, fallback to custom)
 * @param {Object} order - The order object
 * @returns {string} - The database order ID
 */
export const getDatabaseOrderId = (order) => {
  return order.supabase_id || order.id || null;
};

/**
 * Validate order ID format
 * @param {string} orderId - The order ID to validate
 * @returns {boolean} - True if valid
 */
export const isValidOrderId = (orderId) => {
  return isCustomOrderId(orderId) || isSupabaseUUID(orderId);
};

/**
 * Normalize order data for receipt display
 * Handles both object and array formats for items
 * @param {Object} order - The order object
 * @returns {Object} - Normalized order object
 */
export const normalizeOrderForReceipt = (order) => {
  if (!order) return null;

  // Convert items to object format if they're in array format
  let normalizedItems = {};
  
  if (Array.isArray(order.items)) {
    // Convert array to object format
    order.items.forEach((item, index) => {
      const itemId = item.id || `item_${index}`;
      normalizedItems[itemId] = {
        name: item.name || item.item_name || 'Unknown Item',
        quantity: item.quantity || 1,
        price: item.price || 0,
        image: item.image || '🍽️',
        item_amount: item.item_amount || ((item.price || 0) * (item.quantity || 1))
      };
    });
  } else if (order.items && typeof order.items === 'object') {
    // Already in object format, just ensure all required fields
    Object.entries(order.items).forEach(([itemId, item]) => {
      normalizedItems[itemId] = {
        name: item.name || 'Unknown Item',
        quantity: item.quantity || 1,
        price: item.price || 0,
        image: item.image || '🍽️',
        item_amount: item.item_amount || ((item.price || 0) * (item.quantity || 1))
      };
    });
  }

  // Normalize user data
  const normalizedUser = {
    displayName: order.user?.name || order.user?.displayName || 'Unknown User',
    email: order.user?.email || 'no-email@example.com',
    photoURL: order.user?.photoURL || null
  };

  return {
    ...order,
    items: normalizedItems,
    user: normalizedUser,
    total: order.total || order.order_amount || 0,
    timestamp: order.timestamp || order.created_at || new Date().toISOString()
  };
};

// Get the correct order status display for users
export const getOrderStatusDisplay = (order) => {
  // If order has a status field, use it
  if (order.status) {
    switch (order.status.toLowerCase()) {
      case 'pending':
        return {
          status: 'Kitchen to confirm payment',
          description: 'Your order is received. Kitchen will confirm payment shortly.',
          color: 'orange',
          icon: '⏳'
        }
      case 'accepted':
        return {
          status: 'Order Accepted',
          description: 'Your order has been accepted and is being prepared.',
          color: 'blue',
          icon: '👨‍🍳'
        }

      case 'completed':
        return {
          status: 'Order Completed',
          description: 'Your order has been completed. Thank you for your business!',
          color: 'green',
          icon: '🎉'
        }
      case 'rejected':
        return {
          status: 'Order Rejected',
          description: 'Your order was rejected as payment was not confirmed by kitchen staff.',
          color: 'red',
          icon: '❌'
        }
      case 'cancelled':
        return {
          status: 'Order Cancelled',
          description: 'Your order has been cancelled.',
          color: 'red',
          icon: '❌'
        }
      default:
        return {
          status: 'Kitchen to confirm payment',
          description: 'Your order is received. Kitchen will confirm payment shortly.',
          color: 'orange',
          icon: '⏳'
        }
    }
  }
  
  // Default for orders without explicit status (new orders after payment)
  return {
    status: 'Kitchen to confirm payment',
    description: 'Your order is received. Kitchen will confirm payment shortly.',
    color: 'orange',
    icon: '⏳'
  }
}

// Get status badge styling
export const getStatusBadgeStyle = (color) => {
  const styles = {
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  }
  return styles[color] || styles.orange
}
