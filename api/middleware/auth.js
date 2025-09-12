const crypto = require('crypto');

/**
 * Authentication middleware for API endpoints
 * Supports multiple authentication methods:
 * 1. API Key authentication
 * 2. Bearer token authentication
 * 3. Firebase ID token authentication (for frontend)
 */

// Generate a secure API key (run this once to generate your API key)
const generateAPIKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Valid API keys (in production, store these in environment variables or database)
const VALID_API_KEYS = new Set([
  process.env.API_KEY_1 || 'your-secure-api-key-here',
  process.env.API_KEY_2 || 'backup-api-key-here'
]);

// Valid bearer tokens for staff access
const VALID_BEARER_TOKENS = new Set([
  process.env.STAFF_TOKEN_1 || 'staff-secure-token-here',
  process.env.STAFF_TOKEN_2 || 'admin-secure-token-here'
]);

/**
 * Middleware to authenticate API requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateAPI = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];
    const apiKeyQuery = req.query.api_key;

    // Check for API key in headers or query params
    if (apiKey && VALID_API_KEYS.has(apiKey)) {
      req.auth = { type: 'api_key', key: apiKey };
      return next();
    }

    if (apiKeyQuery && VALID_API_KEYS.has(apiKeyQuery)) {
      req.auth = { type: 'api_key', key: apiKeyQuery };
      return next();
    }

    // Check for Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (VALID_BEARER_TOKENS.has(token)) {
        req.auth = { type: 'bearer', token: token };
        return next();
      }
    }

    // Check for Firebase ID token (for frontend requests)
    if (authHeader && authHeader.startsWith('Firebase ')) {
      const idToken = authHeader.substring(9);
      // In a real implementation, you would verify the Firebase ID token here
      // For now, we'll accept it if it's present and not empty
      if (idToken && idToken.length > 10) {
        req.auth = { type: 'firebase', token: idToken };
        return next();
      }
    }

    // No valid authentication found
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Valid API key, Bearer token, or Firebase ID token required',
      hint: 'Include one of: X-API-Key header, api_key query param, or Authorization header'
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware for staff-only endpoints
 * Requires Bearer token or specific API key
 */
const requireStaffAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    // Check for Bearer token (staff/admin access)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (VALID_BEARER_TOKENS.has(token)) {
        req.auth = { type: 'staff', token: token };
        return next();
      }
    }

    // Check for staff API key
    if (apiKey && VALID_API_KEYS.has(apiKey)) {
      req.auth = { type: 'staff_api', key: apiKey };
      return next();
    }

    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Staff authentication required',
      hint: 'Use Bearer token or staff API key'
    });

  } catch (error) {
    console.error('Staff authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during staff authentication'
    });
  }
};

/**
 * Middleware for admin-only endpoints
 * Requires specific admin token
 */
const requireAdminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const adminToken = process.env.ADMIN_TOKEN || 'admin-secure-token-here';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token === adminToken) {
        req.auth = { type: 'admin', token: token };
        return next();
      }
    }

    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin authentication required',
      hint: 'Use admin Bearer token'
    });

  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during admin authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Sets auth info if present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    if (apiKey && VALID_API_KEYS.has(apiKey)) {
      req.auth = { type: 'api_key', key: apiKey };
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (VALID_BEARER_TOKENS.has(token)) {
        req.auth = { type: 'bearer', token: token };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without auth
  }
};

module.exports = {
  authenticateAPI,
  requireStaffAuth,
  requireAdminAuth,
  optionalAuth,
  generateAPIKey,
  VALID_API_KEYS,
  VALID_BEARER_TOKENS
};
