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

  // Helper function to get user initials
  const getInitials = (name) => {
    if (!name || name === 'Unknown') return '?'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Helper function to get consistent color for initials
  const getInitialsColor = (name) => {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange
      '#6366F1'  // indigo
    ]
    
    if (!name || name === 'Unknown') return colors[0]
    
    // Generate consistent color based on name
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const renderActionButton = () => {
    if (loading) {
      return (
        <button disabled className="w-full bg-gray-200 text-gray-400 font-semibold py-2 px-4 rounded-lg transition-all duration-200 cursor-not-allowed">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
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
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Compact Header - Customer Name First */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* User Profile Photo or Initials */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
              {order.user?.photoURL ? (
                <img 
                  src={order.user.photoURL} 
                  alt={order.user?.name || 'User'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full flex items-center justify-center text-sm font-semibold ${
                  order.user?.photoURL ? 'hidden' : 'flex'
                }`}
                style={{ 
                  backgroundColor: getInitialsColor(order.user?.name || 'Unknown'),
                  color: 'white'
                }}
              >
                {getInitials(order.user?.name || 'Unknown')}
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{order.user?.name || 'Unknown User'}</h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">₹{order.order_amount || order.total || 0}</p>
            <p className="text-xs text-gray-500">{formatTime(order.created_at || order.timestamp)}</p>
          </div>
        </div>
      </div>

      {/* Compact Order Info */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-gray-900">#{order.id?.slice(-8) || 'Unknown'}</span>
          </div>
          <span className="text-gray-500 text-xs">{order.user?.email || 'No email'}</span>
        </div>
      </div>

      {/* Compact Order Items with Images */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          {Array.isArray(order.items) && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                {/* Item Image */}
                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name || item.item_name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center bg-gray-200" style={{ display: item.image ? 'none' : 'flex' }}>
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name || item.item_name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                
                {/* Item Price */}
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">₹{item.price * item.quantity}</p>
                  <p className="text-xs text-gray-500">₹{item.price} each</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <svg className="w-6 h-6 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-xs">No items available</p>
            </div>
          )}
        </div>
      </div>

      {/* Compact Action Button */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        {actionSuccess && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium text-sm">Action completed successfully!</span>
            </div>
          </div>
        )}
        {renderActionButton()}
      </div>

      {/* Compact Order Notes */}
      {order.notes && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 font-medium text-sm">Special Instructions</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1 ml-6">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
