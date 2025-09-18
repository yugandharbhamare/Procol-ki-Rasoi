/**
 * Utility functions for handling staff-placed orders
 * Since we can't modify the database schema, we encode staff information in the notes field
 */

/**
 * Parse staff order information from notes field
 * @param {string} notes - The notes field from the order
 * @returns {object} - Parsed staff information
 */
export const parseStaffOrderInfo = (notes) => {
  if (!notes || typeof notes !== 'string') {
    return {
      placed_by_staff: false,
      payment_mode: null,
      staff_placed: false,
      display_notes: notes || ''
    };
  }

  // Check if this is a staff order
  if (notes.startsWith('STAFF_ORDER:')) {
    try {
      // Extract the JSON part and the display notes
      const parts = notes.split('|');
      const jsonPart = parts[0].replace('STAFF_ORDER:', '');
      const displayNotes = parts[1] || '';
      
      const staffInfo = JSON.parse(jsonPart);
      
      return {
        placed_by_staff: staffInfo.placed_by_staff || false,
        payment_mode: staffInfo.payment_mode || null,
        staff_placed: staffInfo.staff_placed || false,
        display_notes: displayNotes
      };
    } catch (error) {
      console.error('Error parsing staff order info:', error);
      return {
        placed_by_staff: false,
        payment_mode: null,
        staff_placed: false,
        display_notes: notes
      };
    }
  }

  // Regular order
  return {
    placed_by_staff: false,
    payment_mode: null,
    staff_placed: false,
    display_notes: notes
  };
};

/**
 * Check if an order was placed by staff
 * @param {object} order - The order object
 * @returns {boolean} - True if placed by staff
 */
export const isStaffOrder = (order) => {
  const staffInfo = parseStaffOrderInfo(order.notes);
  return staffInfo.placed_by_staff;
};

/**
 * Get payment mode from order
 * @param {object} order - The order object
 * @returns {string|null} - Payment mode or null
 */
export const getPaymentMode = (order) => {
  const staffInfo = parseStaffOrderInfo(order.notes);
  return staffInfo.payment_mode;
};

/**
 * Get display notes (without staff metadata)
 * @param {object} order - The order object
 * @returns {string} - Clean display notes
 */
export const getDisplayNotes = (order) => {
  const staffInfo = parseStaffOrderInfo(order.notes);
  return staffInfo.display_notes;
};
