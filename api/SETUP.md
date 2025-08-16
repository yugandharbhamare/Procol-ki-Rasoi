# 🔥 Order Management API Setup Guide

This guide will help you set up the Order Management API with Firebase integration.

## 📋 Prerequisites

1. **Node.js** (v14 or higher)
2. **Firebase Project** with Firestore enabled
3. **Firebase Configuration** from your project settings

## 🚀 Quick Setup

### Step 1: Install Dependencies
```bash
cd api
npm install
```

### Step 2: Configure Firebase
Run the interactive setup script:
```bash
npm run setup
```

This will prompt you for your Firebase configuration details and create a `.env` file.

### Step 3: Start the API Server
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 🔧 Manual Configuration

If you prefer to configure manually:

### 1. Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Go to "Project settings"
5. Scroll down to "Your apps" section
6. Copy the configuration values

### 2. Create Environment File
Copy `env.example` to `.env` and fill in your Firebase details:

```bash
cp env.example .env
```

Edit `.env` with your Firebase configuration:
```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id_here
FIREBASE_MEASUREMENT_ID=your_measurement_id_here

PORT=3001
NODE_ENV=development
```

## 🧪 Testing the Setup

### Test Basic API
```bash
npm test
```

### Test Order Management
```bash
npm run test-orders
```

### Manual Testing
```bash
# Health check
curl http://localhost:3001/health

# Get menu items
curl http://localhost:3001/api/orders/menu

# Calculate order
curl -X POST http://localhost:3001/api/orders/calculate \
  -H "Content-Type: application/json" \
  -d '{"items":[{"name":"Plain Maggi","quantity":2}]}'
```

## 📊 API Endpoints

### Health Check
- `GET /health` - API health status

### Order Calculation
- `POST /api/orders/calculate` - Calculate order total
- `GET /api/orders/menu` - Get all menu items
- `GET /api/orders/validate/:itemName` - Validate single item
- `POST /api/orders/validate-batch` - Validate multiple items

### Order Management
- `POST /api/order-management/create` - Create new order
- `GET /api/order-management` - Get all orders
- `GET /api/order-management/status/:status` - Get orders by status
- `GET /api/order-management/:orderId` - Get specific order
- `POST /api/order-management/:orderId/accept` - Accept order
- `POST /api/order-management/:orderId/ready` - Mark order as ready
- `POST /api/order-management/:orderId/complete` - Complete order
- `POST /api/order-management/:orderId/cancel` - Cancel order

## 🔐 Firebase Security Rules

Make sure your Firestore security rules allow the API to read/write orders:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow API to manage orders
    match /orders/{orderId} {
      allow read, write: if true; // For development
      // For production, add proper authentication
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"Firebase: Missing configuration values"**
   - Check your `.env` file has all required Firebase values
   - Run `npm run setup` to reconfigure

2. **"Firebase app already initialized"**
   - This is normal if you have multiple Firebase instances
   - The API will use the existing configuration

3. **"Permission denied" errors**
   - Check your Firestore security rules
   - Ensure your Firebase project has Firestore enabled

4. **Port already in use**
   - Change the PORT in `.env` file
   - Or kill the process using port 3001

### Debug Mode
To see detailed logs, set `NODE_ENV=development` in your `.env` file.

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_API_KEY` | Firebase API Key | ✅ |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | ✅ |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | ✅ |
| `FIREBASE_APP_ID` | Firebase App ID | ✅ |
| `FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID | ❌ |
| `PORT` | API Server Port | ❌ (default: 3001) |
| `NODE_ENV` | Environment | ❌ (default: development) |

## 🔄 Integration with Frontend

The API is designed to work with your existing React frontend. Use the integration functions from `frontend-order-integration.js`:

```javascript
import { createOrder, acceptOrder, getAllOrders } from './api/frontend-order-integration';

// Create order after payment
const result = await createOrder({
  items: cartItems,
  user: userInfo,
  paymentDetails: paymentDetails
});

// Accept order in staff dashboard
await acceptOrder(orderId, { acceptedBy: 'staff_member' });
```

## 🎯 Next Steps

1. ✅ Configure Firebase
2. ✅ Test the API
3. ✅ Integrate with your React frontend
4. ✅ Set up proper Firebase security rules
5. ✅ Deploy to production

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify your Firebase configuration
3. Check the API logs for error messages
4. Ensure all dependencies are installed
