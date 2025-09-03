// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { syncUsersFromOrders, getUserCount, addTestUser } = require('./firebase-sync.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Firebase to Supabase user sync endpoint
app.post('/api/sync-users', async (req, res) => {
  try {
    console.log('🔄 User sync requested via API');
    
    const result = await syncUsersFromOrders();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        total: result.total,
        successCount: result.successCount,
        errorCount: result.errorCount
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user count endpoint
app.get('/api/user-count', async (req, res) => {
  try {
    const result = await getUserCount();
    
    if (result.success) {
      res.json({
        success: true,
        count: result.count
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API user count error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add test user endpoint
app.post('/api/add-test-user', async (req, res) => {
  try {
    const result = await addTestUser();
    
    if (result.success) {
      res.json({
        success: true,
        user: result.user
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API add test user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
