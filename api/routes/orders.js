const express = require('express');
const { calculateOrder, getMenuItems, isValidItem } = require('../orderCalculator');

const router = express.Router();

/**
 * POST /api/orders/calculate
 * Calculate order total and breakdown
 * 
 * Request body:
 * {
 *   "items": [
 *     { "name": "Plain Maggi", "quantity": 2 },
 *     { "name": "Coca Cola", "quantity": 1 }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "breakdown": [
 *       {
 *         "name": "Plain Maggi",
 *         "quantity": 2,
 *         "unitPrice": 50,
 *         "itemTotal": 100
 *       },
 *       {
 *         "name": "Coca Cola",
 *         "quantity": 1,
 *         "unitPrice": 35,
 *         "itemTotal": 35
 *       }
 *     ],
 *     "subtotal": 135,
 *     "tax": 7,
 *     "total": 142,
 *     "currency": "INR",
 *     "timestamp": "2024-01-15T10:30:00.000Z"
 *   }
 * }
 */
router.post('/calculate', (req, res) => {
  try {
    const { items } = req.body;

    // Validate request body
    if (!items) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required in request body'
      });
    }

    // Calculate order
    const result = calculateOrder(items);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Order calculation error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders/menu
 * Get all available menu items and their prices
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "items": {
 *       "Plain Maggi": 50,
 *       "Coca Cola": 35,
 *       ...
 *     },
 *     "currency": "INR",
 *     "lastUpdated": "2024-01-15T10:30:00.000Z"
 *   }
 * }
 */
router.get('/menu', (req, res) => {
  try {
    const menuData = getMenuItems();

    res.json({
      success: true,
      data: menuData
    });

  } catch (error) {
    console.error('Menu retrieval error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve menu items'
    });
  }
});

/**
 * GET /api/orders/validate/:itemName
 * Validate if an item exists in the menu
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "itemName": "Plain Maggi",
 *     "exists": true,
 *     "price": 50
 *   }
 * }
 */
router.get('/validate/:itemName', (req, res) => {
  try {
    const { itemName } = req.params;
    
    if (!itemName) {
      return res.status(400).json({
        success: false,
        error: 'Item name is required'
      });
    }

    const exists = isValidItem(itemName);
    const price = exists ? require('../priceMap')[itemName] : null;

    res.json({
      success: true,
      data: {
        itemName: itemName,
        exists: exists,
        price: price
      }
    });

  } catch (error) {
    console.error('Item validation error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate item'
    });
  }
});

/**
 * POST /api/orders/validate-batch
 * Validate multiple items at once
 * 
 * Request body:
 * {
 *   "items": ["Plain Maggi", "Coca Cola", "Invalid Item"]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "validItems": ["Plain Maggi", "Coca Cola"],
 *     "invalidItems": ["Invalid Item"],
 *     "results": [
 *       { "name": "Plain Maggi", "exists": true, "price": 50 },
 *       { "name": "Coca Cola", "exists": true, "price": 35 },
 *       { "name": "Invalid Item", "exists": false, "price": null }
 *     ]
 *   }
 * }
 */
router.post('/validate-batch', (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items must be an array'
      });
    }

    const results = [];
    const validItems = [];
    const invalidItems = [];

    items.forEach(itemName => {
      const exists = isValidItem(itemName);
      const price = exists ? require('../priceMap')[itemName] : null;

      results.push({
        name: itemName,
        exists: exists,
        price: price
      });

      if (exists) {
        validItems.push(itemName);
      } else {
        invalidItems.push(itemName);
      }
    });

    res.json({
      success: true,
      data: {
        validItems: validItems,
        invalidItems: invalidItems,
        results: results
      }
    });

  } catch (error) {
    console.error('Batch validation error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate items'
    });
  }
});

module.exports = router;
