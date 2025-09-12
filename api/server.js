// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import security middleware
const { generalLimiter, orderCreationLimiter, orderUpdateLimiter, adminLimiter, imageUploadLimiter } = require('./middleware/rateLimit');
const { sanitizeRequest } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
app.use(generalLimiter);

// Request sanitization
app.use(sanitizeRequest);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use('/optimized', express.static(path.join(__dirname, '../public/optimized')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Procol ki Rasoi API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      orders: '/api/orders',
      menu: '/api/menu'
    }
  });
});

// Basic orders endpoint (placeholder)
app.get('/api/orders', (req, res) => {
  res.json({
    message: 'Orders endpoint - implement when database is ready',
    status: 'placeholder'
  });
});

// Basic menu endpoint (placeholder)
app.get('/api/menu', (req, res) => {
  res.json({
    message: 'Menu endpoint - implement when database is ready',
    status: 'placeholder'
  });
});

// Image upload routes (with rate limiting)
try {
  const imageUploadRoutes = require('./routes/imageUpload');
  app.use('/api', imageUploadLimiter, imageUploadRoutes);
  console.log('✅ Image upload routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load image upload routes:', error);
}

// Secure order management routes
try {
  const secureOrderRoutes = require('./routes/secureOrderManagement');
  app.use('/api/secure/orders', secureOrderRoutes);
  console.log('✅ Secure order management routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load secure order management routes:', error);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      '/health', 
      '/api/orders', 
      '/api/menu',
      '/api/upload-image',
      '/api/delete-image',
      '/api/image-info/:fileName'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Procol ki Rasoi API server running on port', PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('📋 API documentation: http://localhost:' + PORT + '/');
  console.log('🕐 Started at:', new Date().toISOString());
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
