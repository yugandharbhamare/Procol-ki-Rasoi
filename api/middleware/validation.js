const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for API endpoints
 */

// Sanitize and validate order creation request
const validateOrderCreation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  
  body('items.*.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters')
    .escape(),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 50 })
    .withMessage('Item quantity must be between 1 and 50'),
  
  body('user.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required'),
  
  body('user.displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters')
    .escape(),
  
  body('paymentDetails.status')
    .optional()
    .isIn(['success', 'pending', 'failed'])
    .withMessage('Payment status must be success, pending, or failed'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
    .escape(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors.array()
      });
    }
    next();
  }
];

// Validate order ID parameter
const validateOrderId = [
  param('orderId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Order ID must be between 1 and 100 characters')
    .escape(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid order ID',
        details: errors.array()
      });
    }
    next();
  }
];

// Validate order status parameter
const validateOrderStatus = [
  param('status')
    .isIn(['pending', 'accepted', 'ready', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, accepted, ready, completed, cancelled'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid order status',
        details: errors.array()
      });
    }
    next();
  }
];

// Validate order status update request
const validateOrderStatusUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'accepted', 'ready', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, accepted, ready, completed, cancelled'),
  
  body('acceptedBy')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Accepted by must be between 1 and 100 characters')
    .escape(),
  
  body('markedReadyBy')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Marked ready by must be between 1 and 100 characters')
    .escape(),
  
  body('completedBy')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Completed by must be between 1 and 100 characters')
    .escape(),
  
  body('cancelledBy')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Cancelled by must be between 1 and 100 characters')
    .escape(),
  
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must be less than 500 characters')
    .escape(),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
    .escape(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors.array()
      });
    }
    next();
  }
];

// Validate menu item creation/update
const validateMenuItem = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters')
    .escape(),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10000'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .escape(),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters')
    .escape(),
  
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available must be a boolean'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid menu item data',
        details: errors.array()
      });
    }
    next();
  }
];

// Validate pagination parameters
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid pagination parameters',
        details: errors.array()
      });
    }
    next();
  }
];

// Sanitize request body to prevent XSS
const sanitizeRequest = (req, res, next) => {
  // Recursively sanitize string values in request body
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = {
  validateOrderCreation,
  validateOrderId,
  validateOrderStatus,
  validateOrderStatusUpdate,
  validateMenuItem,
  validatePagination,
  sanitizeRequest
};
