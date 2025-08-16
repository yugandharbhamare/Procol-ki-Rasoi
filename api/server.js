// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const ordersRouter = require('./routes/orders');
const orderManagementRouter = require('./routes/orderManagement');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/orders', ordersRouter);
app.use('/api/order-management', orderManagementRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Procol ki Rasoi API',
    version: '1.0.0',
          endpoints: {
        health: '/health',
        calculateOrder: 'POST /api/orders/calculate',
        getMenu: 'GET /api/orders/menu',
        validateItem: 'GET /api/orders/validate/:itemName',
        validateBatch: 'POST /api/orders/validate-batch',
        createOrder: 'POST /api/order-management/create',
        updateOrderStatus: 'PUT /api/order-management/:orderId/status',
        acceptOrder: 'POST /api/order-management/:orderId/accept',
        markReady: 'POST /api/order-management/:orderId/ready',
        completeOrder: 'POST /api/order-management/:orderId/complete',
        cancelOrder: 'POST /api/order-management/:orderId/cancel',
        getOrders: 'GET /api/order-management',
        getOrdersByStatus: 'GET /api/order-management/status/:status'
      },
    documentation: 'Check the README for detailed API documentation'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Procol ki Rasoi API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API documentation: http://localhost:${PORT}/`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
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
