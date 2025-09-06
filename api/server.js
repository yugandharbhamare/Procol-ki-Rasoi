// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

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

// Image upload routes
const imageUploadRoutes = require('./routes/imageUpload');
app.use('/api', imageUploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: ['/health', '/api/orders', '/api/menu']
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
