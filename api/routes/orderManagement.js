const express = require('express');
const { 
  createOrder, 
  updateOrderStatus, 
  getOrdersByStatus, 
  getOrderById, 
  subscribeToOrders,
  ORDER_STATUS 
} = require('../orderService');

const router = express.Router();

/**
 * POST /api/orders/create
 * Create a new order after payment confirmation
 * 
 * Request body:
 * {
 *   "items": [
 *     { "name": "Plain Maggi", "quantity": 2 },
 *     { "name": "Coca Cola", "quantity": 1 }
 *   ],
 *   "user": {
 *     "email": "customer@example.com",
 *     "displayName": "John Doe",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "phone": "+1234567890"
 *   },
 *   "paymentDetails": {
 *     "status": "success",
 *     "method": "UPI",
 *     "transactionId": "txn_123456"
 *   },
 *   "notes": "Extra spicy please"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "orderId": "order_123",
 *   "order": { ... },
 *   "message": "Order created successfully and is now pending staff approval"
 * }
 */
router.post('/create', async (req, res) => {
  try {
    const result = await createOrder(req.body);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

/**
 * PUT /api/orders/:orderId/status
 * Update order status (for staff actions)
 * 
 * Request body:
 * {
 *   "status": "accepted",
 *   "additionalData": {
 *     "acceptedBy": "staff_member_name",
 *     "notes": "Starting preparation"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Order status updated to accepted",
 *   "orderId": "order_123",
 *   "status": "accepted"
 * }
 */
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, additionalData = {} } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${Object.values(ORDER_STATUS).join(', ')}`
      });
    }

    const result = await updateOrderStatus(orderId, status, additionalData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

/**
 * GET /api/orders/status/:status
 * Get orders by status
 * 
 * Response:
 * {
 *   "success": true,
 *   "orders": [ ... ],
 *   "count": 5
 * }
 */
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 50 } = req.query;

    const result = await getOrdersByStatus(status, parseInt(limit));

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error getting orders by status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
});

/**
 * GET /api/orders/:orderId
 * Get order by ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "order": { ... }
 * }
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await getOrderById(orderId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
});

/**
 * GET /api/orders
 * Get all orders with real-time updates (WebSocket-like endpoint)
 * This endpoint returns current orders and can be polled for updates
 * 
 * Response:
 * {
 *   "success": true,
 *   "orders": [ ... ],
 *   "ordersByStatus": {
 *     "pending": [ ... ],
 *     "accepted": [ ... ],
 *     "ready": [ ... ],
 *     "completed": [ ... ],
 *     "cancelled": [ ... ]
 *   },
 *   "counts": {
 *     "pending": 3,
 *     "accepted": 2,
 *     "ready": 1,
 *     "completed": 10,
 *     "cancelled": 1,
 *     "total": 17
 *   }
 * }
 */
router.get('/', async (req, res) => {
  try {
    // For HTTP requests, we'll return current state
    // For real-time updates, use WebSocket or Server-Sent Events
    const result = await getOrdersByStatus('all', 100);

    if (result.success) {
      // Group orders by status
      const ordersByStatus = {
        pending: result.orders.filter(order => order.status === ORDER_STATUS.PENDING),
        accepted: result.orders.filter(order => order.status === ORDER_STATUS.ACCEPTED),
        ready: result.orders.filter(order => order.status === ORDER_STATUS.READY),
        completed: result.orders.filter(order => order.status === ORDER_STATUS.COMPLETED),
        cancelled: result.orders.filter(order => order.status === ORDER_STATUS.CANCELLED)
      };

      const counts = {
        pending: ordersByStatus.pending.length,
        accepted: ordersByStatus.accepted.length,
        ready: ordersByStatus.ready.length,
        completed: ordersByStatus.completed.length,
        cancelled: ordersByStatus.cancelled.length,
        total: result.orders.length
      };

      res.json({
        success: true,
        orders: result.orders,
        ordersByStatus: ordersByStatus,
        counts: counts
      });
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
});

/**
 * POST /api/orders/:orderId/accept
 * Accept order (move from pending to accepted)
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Order accepted successfully",
 *   "orderId": "order_123",
 *   "status": "accepted"
 * }
 */
router.post('/:orderId/accept', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { acceptedBy = 'staff', notes = '' } = req.body;

    const result = await updateOrderStatus(orderId, ORDER_STATUS.ACCEPTED, {
      acceptedBy,
      notes
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept order'
    });
  }
});

/**
 * POST /api/orders/:orderId/ready
 * Mark order as ready (move from accepted to ready)
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Order marked as ready",
 *   "orderId": "order_123",
 *   "status": "ready"
 * }
 */
router.post('/:orderId/ready', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { markedReadyBy = 'staff', notes = '' } = req.body;

    const result = await updateOrderStatus(orderId, ORDER_STATUS.READY, {
      markedReadyBy,
      notes
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error marking order as ready:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark order as ready'
    });
  }
});

/**
 * POST /api/orders/:orderId/complete
 * Complete order (move from ready to completed)
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Order completed successfully",
 *   "orderId": "order_123",
 *   "status": "completed"
 * }
 */
router.post('/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { completedBy = 'staff', notes = '' } = req.body;

    const result = await updateOrderStatus(orderId, ORDER_STATUS.COMPLETED, {
      completedBy,
      notes
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete order'
    });
  }
});

/**
 * POST /api/orders/:orderId/cancel
 * Cancel order (move to cancelled)
 * 
 * Request body:
 * {
 *   "cancellationReason": "Payment failed",
 *   "cancelledBy": "staff_member_name"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Order cancelled successfully",
 *   "orderId": "order_123",
 *   "status": "cancelled"
 * }
 */
router.post('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancellationReason = 'Payment failed', cancelledBy = 'staff' } = req.body;

    const result = await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, {
      cancellationReason,
      cancelledBy
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

module.exports = router;
