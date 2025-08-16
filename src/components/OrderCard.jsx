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
        <button disabled className="w-full bg-gray-200 text-gray-400 font-semibold py-3 px-6 rounded-xl transition-all duration-200 cursor-not-allowed">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-2"></div>
            Processing...
          </div>
        </button>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <button
            onClick={() => handleAction('accept')}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept Order
            </div>
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={() => handleAction('ready')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark as Ready
            </div>
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleAction('complete')}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Complete Order
            </div>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header Section - Most Important Information */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">#{order.id?.slice(-8) || 'Unknown'}</h3>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${getStatusColor(status)}`}>
                {getStatusText(status)}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {formatDate(order.created_at || order.timestamp)} • {formatTime(order.created_at || order.timestamp)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">₹{order.order_amount || order.total || 0}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</p>
          </div>
        </div>
      </div>

      {/* Customer Information - Secondary Priority */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900">Customer Information</h4>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm min-w-[60px]">Name:</span>
            <span className="font-medium text-gray-900">{order.user?.name || 'Unknown User'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm min-w-[60px]">Email:</span>
            <span className="font-medium text-gray-900">{order.user?.email || 'No email provided'}</span>
          </div>
        </div>
      </div>

      {/* Order Items - Third Priority */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900">Order Items</h4>
        </div>
        
        <div className="space-y-3">
          {Array.isArray(order.items) && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name || item.item_name}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                  <p className="text-xs text-gray-500">₹{item.price} each</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">No items available</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button - Call to Action */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        {actionSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium">Action completed successfully!</span>
            </div>
          </div>
        )}
        {renderActionButton()}
      </div>

      {/* Order Notes - Least Priority */}
      {order.notes && (
        <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h5 className="font-medium text-yellow-800">Special Instructions</h5>
          </div>
          <p className="text-sm text-yellow-700 ml-9">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
