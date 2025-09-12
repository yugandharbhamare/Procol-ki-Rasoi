const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware to prevent API abuse
 */

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiting for order creation
const orderCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 order creations per 5 minutes
  message: {
    success: false,
    error: 'Too Many Order Requests',
    message: 'Too many order creation requests, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too Many Order Requests',
      message: 'Too many order creation requests, please try again later.',
      retryAfter: '5 minutes'
    });
  }
});

// Strict rate limiting for order status updates
const orderUpdateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 order updates per minute
  message: {
    success: false,
    error: 'Too Many Update Requests',
    message: 'Too many order update requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too Many Update Requests',
      message: 'Too many order update requests, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

// Very strict rate limiting for admin operations
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 admin requests per 15 minutes
  message: {
    success: false,
    error: 'Too Many Admin Requests',
    message: 'Too many admin requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too Many Admin Requests',
      message: 'Too many admin requests, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Rate limiting for image uploads
const imageUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 image uploads per 10 minutes
  message: {
    success: false,
    error: 'Too Many Upload Requests',
    message: 'Too many image upload requests, please try again later.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too Many Upload Requests',
      message: 'Too many image upload requests, please try again later.',
      retryAfter: '10 minutes'
    });
  }
});

module.exports = {
  generalLimiter,
  orderCreationLimiter,
  orderUpdateLimiter,
  adminLimiter,
  imageUploadLimiter
};
