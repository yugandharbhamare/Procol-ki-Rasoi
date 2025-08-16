// Example of how to integrate the API with the React frontend
// This can be used in your React components

const API_BASE_URL = 'http://localhost:3001';

/**
 * Calculate order total using the API
 * @param {Array} items - Array of items with name and quantity
 * @returns {Promise<Object>} - Order calculation result
 */
export async function calculateOrderTotal(items) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error) {
    console.error('Error calculating order:', error);
    throw error;
  }
}

/**
 * Get all menu items and their prices
 * @returns {Promise<Object>} - Menu data
 */
export async function getMenuItems() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/menu`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }
}

/**
 * Validate if an item exists in the menu
 * @param {string} itemName - Name of the item to validate
 * @returns {Promise<Object>} - Validation result
 */
export async function validateMenuItem(itemName) {
  try {
    const encodedName = encodeURIComponent(itemName);
    const response = await fetch(`${API_BASE_URL}/api/orders/validate/${encodedName}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error) {
    console.error('Error validating item:', error);
    throw error;
  }
}

/**
 * Validate multiple items at once
 * @param {Array} itemNames - Array of item names to validate
 * @returns {Promise<Object>} - Batch validation result
 */
export async function validateMenuItems(itemNames) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/validate-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: itemNames })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error) {
    console.error('Error validating items:', error);
    throw error;
  }
}

// Example usage in a React component:
/*
import React, { useState, useEffect } from 'react';
import { calculateOrderTotal, getMenuItems } from './api-integration';

function OrderCalculator() {
  const [menuItems, setMenuItems] = useState({});
  const [order, setOrder] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load menu items on component mount
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const menuData = await getMenuItems();
      setMenuItems(menuData.items);
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  };

  const addItemToOrder = (itemName, quantity = 1) => {
    setOrder(prev => [...prev, { name: itemName, quantity }]);
  };

  const calculateTotal = async () => {
    if (order.length === 0) return;

    setLoading(true);
    try {
      const result = await calculateOrderTotal(order);
      setTotal(result);
    } catch (error) {
      console.error('Failed to calculate total:', error);
      alert('Error calculating order total: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Order Calculator</h2>
      
      {/* Menu Items */}
      <div>
        <h3>Menu Items</h3>
        {Object.entries(menuItems).map(([name, price]) => (
          <button
            key={name}
            onClick={() => addItemToOrder(name, 1)}
            style={{ margin: '5px', padding: '10px' }}
          >
            {name} - ₹{price}
          </button>
        ))}
      </div>

      {/* Current Order */}
      <div>
        <h3>Current Order</h3>
        {order.map((item, index) => (
          <div key={index}>
            {item.name} x{item.quantity}
          </div>
        ))}
        <button onClick={calculateTotal} disabled={loading || order.length === 0}>
          {loading ? 'Calculating...' : 'Calculate Total'}
        </button>
      </div>

      {/* Total */}
      {total && (
        <div>
          <h3>Order Total</h3>
          <div>Subtotal: ₹{total.subtotal}</div>
          <div>Tax: ₹{total.tax}</div>
          <div><strong>Total: ₹{total.total}</strong></div>
          
          <h4>Breakdown:</h4>
          {total.breakdown.map((item, index) => (
            <div key={index}>
              {item.name} x{item.quantity} = ₹{item.itemTotal}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderCalculator;
*/
