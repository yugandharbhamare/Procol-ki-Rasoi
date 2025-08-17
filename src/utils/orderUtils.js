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
