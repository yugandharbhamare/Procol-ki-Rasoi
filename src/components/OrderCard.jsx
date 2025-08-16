import { useState } from 'react';
import { useStaffOrders } from '../contexts/StaffOrderContext';

export default function OrderCard({ order, status }) {
  const { acceptOrder, markOrderAsReady, completeOrder } = useStaffOrders();
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAction = async (action) => {
    console.log(`OrderCard: Starting ${action} action for order ${order.id}`);
    setLoading(true);
    try {
      let result;
      switch (action) {
        case 'accept':
          console.log(`OrderCard: Calling acceptOrder for order ${order.id}`);
          result = await acceptOrder(order.id);
          console.log(`OrderCard: acceptOrder result:`, result);
          break;
        case 'ready':
          console.log(`OrderCard: Calling markOrderAsReady for order ${order.id}`);
          result = await markOrderAsReady(order.id);
          console.log(`OrderCard: markOrderAsReady result:`, result);
          break;
        case 'complete':
          console.log(`OrderCard: Calling completeOrder for order ${order.id}`);
          result = await completeOrder(order.id);
          console.log(`OrderCard: completeOrder result:`, result);
          break;
        default:
          break;
      }
      
      if (!result?.success) {
        console.error(`OrderCard: ${action} action failed:`, result?.error);
        alert(result?.error || 'Action failed. Please try again.');
      } else {
        console.log(`OrderCard: ${action} action completed successfully`);
        setActionSuccess(true);
        // Hide success message after 3 seconds
        setTimeout(() => setActionSuccess(false), 3000);
      }
    } catch (error) {
      console.error(`OrderCard: Error performing ${action} action:`, error);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Awaiting Confirmation';
      case 'accepted':
        return 'In Preparation';
      case 'ready':
        return 'Ready for Pickup';
      default:
        return status;
    }
  };

  const renderActionButton = () => {
    if (loading) {
      return (
        <button disabled className="w-full bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mx-auto"></div>
        </button>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <button
            onClick={() => handleAction('accept')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Accept Order
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={() => handleAction('ready')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Mark as Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleAction('complete')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Complete Order
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(order.created_at || order.timestamp)} at {formatTime(order.created_at || order.timestamp)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">₹{order.order_amount || order.total || 0}</p>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <span className="ml-2 font-medium">{order.user?.name || 'Unknown User'}</span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>
            <span className="ml-2 font-medium">{order.user?.email || 'No email provided'}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
        <div className="space-y-2">
          {Array.isArray(order.items) ? (
            order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.name || item.item_name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm">No items available</div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="border-t border-gray-200 pt-4">
        {actionSuccess && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium">Action completed successfully!</span>
            </div>
          </div>
        )}
        {renderActionButton()}
      </div>

      {/* Order Notes (if any) */}
      {order.notes && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h5 className="font-medium text-yellow-800 mb-1">Special Instructions</h5>
          <p className="text-sm text-yellow-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
