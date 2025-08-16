const priceMap = require('./priceMap');

/**
 * Calculate order total and breakdown
 * @param {Array} items - Array of items with name and quantity
 * @returns {Object} - Order breakdown and total
 */
function calculateOrder(items) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  if (items.length === 0) {
    throw new Error('Items array cannot be empty');
  }

  const breakdown = [];
  let total = 0;
  const errors = [];

  items.forEach((item, index) => {
    // Validate item structure
    if (!item.name || typeof item.name !== 'string') {
      errors.push(`Item ${index + 1}: Missing or invalid name`);
      return;
    }

    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Item ${index + 1} (${item.name}): Missing or invalid quantity`);
      return;
    }

    const itemName = item.name.trim();
    const quantity = Math.floor(item.quantity); // Ensure integer quantity

    // Check if item exists in price map
    if (!priceMap[itemName]) {
      errors.push(`Item ${index + 1}: "${itemName}" not found in menu`);
      return;
    }

    const unitPrice = priceMap[itemName];
    const itemTotal = unitPrice * quantity;

    breakdown.push({
      name: itemName,
      quantity: quantity,
      unitPrice: unitPrice,
      itemTotal: itemTotal
    });

    total += itemTotal;
  });

  // If there are errors, throw them
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join('; ')}`);
  }

  return {
    breakdown: breakdown,
    subtotal: total,
    tax: Math.round(total * 0.05), // 5% tax
    total: Math.round(total * 1.05), // Total with tax
    currency: 'INR',
    timestamp: new Date().toISOString()
  };
}

/**
 * Get all available menu items and their prices
 * @returns {Object} - Complete price map
 */
function getMenuItems() {
  return {
    items: priceMap,
    currency: 'INR',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Validate if an item exists in the menu
 * @param {string} itemName - Name of the item to check
 * @returns {boolean} - True if item exists, false otherwise
 */
function isValidItem(itemName) {
  return priceMap.hasOwnProperty(itemName);
}

module.exports = {
  calculateOrder,
  getMenuItems,
  isValidItem,
  priceMap
};
