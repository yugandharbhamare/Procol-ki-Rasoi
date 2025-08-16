# Procol ki Rasoi API

A Node.js REST API for calculating order totals and managing menu items for Procol ki Rasoi restaurant.

## 🚀 Quick Start

### Installation

```bash
cd api
npm install
```

### Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on port 3001 by default. You can change this by setting the `PORT` environment variable.

## 📋 API Endpoints

### Base URL
```
http://localhost:3001
```

### Order Management Endpoints

#### 1. Create Order
**POST** `/api/order-management/create`

Create a new order after payment confirmation.

**Request Body:**
```json
{
  "items": [
    { "name": "Plain Maggi", "quantity": 2 },
    { "name": "Coca Cola", "quantity": 1 }
  ],
  "user": {
    "email": "customer@example.com",
    "displayName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  },
  "paymentDetails": {
    "status": "success",
    "method": "UPI",
    "transactionId": "txn_123456"
  },
  "notes": "Extra spicy please"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_123",
  "order": {
    "id": "order_123",
    "items": [...],
    "user": {...},
    "total": 189,
    "status": "pending",
    "paymentDetails": {...},
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Order created successfully and is now pending staff approval"
}
```

#### 2. Accept Order
**POST** `/api/order-management/:orderId/accept`

Accept an order (move from pending to accepted).

**Request Body:**
```json
{
  "acceptedBy": "staff_member_name",
  "notes": "Starting preparation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "orderId": "order_123",
  "status": "accepted"
}
```

#### 3. Mark Order as Ready
**POST** `/api/order-management/:orderId/ready`

Mark order as ready (move from accepted to ready).

**Request Body:**
```json
{
  "markedReadyBy": "staff_member_name",
  "notes": "Order is ready for pickup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order marked as ready",
  "orderId": "order_123",
  "status": "ready"
}
```

#### 4. Complete Order
**POST** `/api/order-management/:orderId/complete`

Complete order (move from ready to completed).

**Request Body:**
```json
{
  "completedBy": "staff_member_name",
  "notes": "Order delivered to customer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order completed successfully",
  "orderId": "order_123",
  "status": "completed"
}
```

#### 5. Cancel Order
**POST** `/api/order-management/:orderId/cancel`

Cancel order (move to cancelled).

**Request Body:**
```json
{
  "cancellationReason": "Payment failed",
  "cancelledBy": "staff_member_name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "orderId": "order_123",
  "status": "cancelled"
}
```

#### 6. Get Orders by Status
**GET** `/api/order-management/status/:status`

Get orders filtered by status (pending, accepted, ready, completed, cancelled).

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "count": 5
}
```

#### 7. Get All Orders
**GET** `/api/order-management`

Get all orders with counts by status.

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "ordersByStatus": {
    "pending": [...],
    "accepted": [...],
    "ready": [...],
    "completed": [...],
    "cancelled": [...]
  },
  "counts": {
    "pending": 3,
    "accepted": 2,
    "ready": 1,
    "completed": 10,
    "cancelled": 1,
    "total": 17
  }
}
```

#### 8. Get Order by ID
**GET** `/api/order-management/:orderId`

Get specific order details.

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "items": [...],
    "user": {...},
    "total": 189,
    "status": "accepted",
    "paymentDetails": {...},
    "createdAt": "2024-01-15T10:30:00.000Z",
    "acceptedAt": "2024-01-15T10:35:00.000Z",
    "acceptedBy": "staff_member"
  }
}
```

#### 9. Update Order Status (Generic)
**PUT** `/api/order-management/:orderId/status`

Update order status with additional data.

**Request Body:**
```json
{
  "status": "accepted",
  "additionalData": {
    "acceptedBy": "staff_member_name",
    "notes": "Starting preparation"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated to accepted",
  "orderId": "order_123",
  "status": "accepted"
}
```

### Order Status Flow

```
Payment Confirmation → Create Order (pending)
         ↓
   Staff Accepts → Order (accepted) → In Preparation
         ↓
   Staff Marks Ready → Order (ready) → Ready for Pickup
         ↓
   Staff Completes → Order (completed) → Delivered
         ↓
   OR Staff Cancels → Order (cancelled) → Cancelled
```

### Order Calculation Endpoints

### 1. Health Check
**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### 2. Calculate Order Total
**POST** `/api/orders/calculate`

Calculate the total amount for a list of items with quantities.

**Request Body:**
```json
{
  "items": [
    { "name": "Plain Maggi", "quantity": 2 },
    { "name": "Coca Cola", "quantity": 1 },
    { "name": "Bhel Puri", "quantity": 1 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "breakdown": [
      {
        "name": "Plain Maggi",
        "quantity": 2,
        "unitPrice": 50,
        "itemTotal": 100
      },
      {
        "name": "Coca Cola",
        "quantity": 1,
        "unitPrice": 35,
        "itemTotal": 35
      },
      {
        "name": "Bhel Puri",
        "quantity": 1,
        "unitPrice": 45,
        "itemTotal": 45
      }
    ],
    "subtotal": 180,
    "tax": 9,
    "total": 189,
    "currency": "INR",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Get Menu Items
**GET** `/api/orders/menu`

Get all available menu items and their prices.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": {
      "Plain Maggi": 50,
      "Butter Atta Maggi": 60,
      "Cheese Atta Maggi": 70,
      "Coca Cola": 35,
      "Bhel Puri": 45,
      // ... more items
    },
    "currency": "INR",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Validate Single Item
**GET** `/api/orders/validate/:itemName`

Check if a specific item exists in the menu and get its price.

**Example:** `GET /api/orders/validate/Plain%20Maggi`

**Response:**
```json
{
  "success": true,
  "data": {
    "itemName": "Plain Maggi",
    "exists": true,
    "price": 50
  }
}
```

### 5. Validate Multiple Items
**POST** `/api/orders/validate-batch`

Validate multiple items at once.

**Request Body:**
```json
{
  "items": ["Plain Maggi", "Coca Cola", "Invalid Item"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validItems": ["Plain Maggi", "Coca Cola"],
    "invalidItems": ["Invalid Item"],
    "results": [
      { "name": "Plain Maggi", "exists": true, "price": 50 },
      { "name": "Coca Cola", "exists": true, "price": 35 },
      { "name": "Invalid Item", "exists": false, "price": null }
    ]
  }
}
```

## 🍽️ Available Menu Items

### Maggi Items
- Plain Maggi: ₹50
- Butter Atta Maggi: ₹60
- Cheese Atta Maggi: ₹70
- Cheese Maggi: ₹65
- Veg butter maggi: ₹55
- Veg cheese maggi: ₹65

### Sandwiches
- Aloo sandwich: ₹40
- Aloo cheese sandwich: ₹50
- Veg Cheese Sandwich: ₹55

### Snacks
- Aloo Bhujia: ₹30
- Bhel Puri: ₹45
- Fatafat Bhel: ₹40
- Lite Mixture: ₹35
- Popcorn: ₹25
- Salted Peanuts: ₹20
- Sauf: ₹15

### Beverages
- Amul Chaas: ₹30
- Amul Lassi: ₹40
- Coca Cola: ₹35
- Ginger Tea: ₹20

### Breakfast Items
- Besan Chila: ₹45
- Masala Oats: ₹50
- MTR Poha: ₹40
- MTR Upma: ₹40
- Moong Dal: ₹35

### Biscuits
- Bourbon Biscuits: ₹15
- Good Day Biscuit: ₹10
- Parle G Biscuit: ₹8
- Pass Pass: ₹12

### Other Items
- Cheese: ₹25
- Cucumber: ₹15
- Gud: ₹20
- Heeng Chana: ₹30
- Mix Salad: ₹35
- Onion: ₹10
- Pasta: ₹80

## 🔧 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Scenarios

1. **Invalid item name:**
   ```json
   {
     "success": false,
     "error": "Validation errors: Item 1: \"Invalid Item\" not found in menu"
   }
   ```

2. **Invalid quantity:**
   ```json
   {
     "success": false,
     "error": "Validation errors: Item 1 (Plain Maggi): Missing or invalid quantity"
   }
   ```

3. **Missing items array:**
   ```json
   {
     "success": false,
     "error": "Items array is required in request body"
   }
   ```

## 🧪 Testing Examples

### Using cURL

**Calculate order:**
```bash
curl -X POST http://localhost:3001/api/orders/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"name": "Plain Maggi", "quantity": 2},
      {"name": "Coca Cola", "quantity": 1}
    ]
  }'
```

**Get menu:**
```bash
curl http://localhost:3001/api/orders/menu
```

**Validate item:**
```bash
curl http://localhost:3001/api/orders/validate/Plain%20Maggi
```

### Using JavaScript/Fetch

```javascript
// Calculate order
const response = await fetch('http://localhost:3001/api/orders/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      { name: 'Plain Maggi', quantity: 2 },
      { name: 'Coca Cola', quantity: 1 }
    ]
  })
});

const result = await response.json();
console.log(result);
```

## 📊 Features

- ✅ **Order calculation** with detailed breakdown
- ✅ **Tax calculation** (5% tax rate)
- ✅ **Item validation** (single and batch)
- ✅ **Menu management** with predefined prices
- ✅ **Error handling** with descriptive messages
- ✅ **CORS enabled** for cross-origin requests
- ✅ **Security headers** with Helmet
- ✅ **Request logging** with Morgan
- ✅ **Health check** endpoint
- ✅ **Graceful shutdown** handling

## 🔒 Security

- Helmet.js for security headers
- Input validation and sanitization
- CORS configuration
- Request size limits
- Error message sanitization in production

## 📝 Notes

- All prices are in Indian Rupees (INR)
- Tax rate is set to 5%
- Quantities are automatically converted to integers
- Item names are case-sensitive and must match exactly
- The API runs on port 3001 by default
