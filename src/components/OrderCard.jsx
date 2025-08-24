import { useState } from 'react';
import { useStaffOrders } from '../contexts/StaffOrderContext';
import { getDisplayOrderId, getDatabaseOrderId } from '../utils/orderUtils';

export default function OrderCard({ order, status }) {
  const { acceptOrder, completeOrder, cancelOrder, deleteOrder } = useStaffOrders();
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today, yesterday, or another date
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
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
      // Use Supabase ID for database operations, custom ID for display
      const orderIdForUpdate = getDatabaseOrderId(order);
      
      switch (action) {
        case 'accept':
          console.log(`OrderCard: Calling acceptOrder for order ${orderIdForUpdate}`);
          result = await acceptOrder(orderIdForUpdate);
          console.log(`OrderCard: acceptOrder result:`, result);
          break;

        case 'complete':
          console.log(`OrderCard: Calling completeOrder for order ${orderIdForUpdate}`);
          result = await completeOrder(orderIdForUpdate);
          console.log(`OrderCard: completeOrder result:`, result);
          break;
        case 'cancel':
          console.log(`OrderCard: Calling cancelOrder for order ${orderIdForUpdate}`);
          result = await cancelOrder(orderIdForUpdate);
          console.log(`OrderCard: cancelOrder result:`, result);
          break;
        case 'delete':
          console.log(`OrderCard: Calling deleteOrder for order ${orderIdForUpdate}`);
          result = await deleteOrder(orderIdForUpdate);
          console.log(`OrderCard: deleteOrder result:`, result);
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
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';

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
      case 'cancelled':
        return 'Order Cancelled';

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

  // Helper function to get menu item image path
  const getMenuItemImage = (itemName) => {
    const menuItemImages = {
      // Hot Beverages
      'Ginger Chai': '/optimized/Ginger Tea.png',
      'Masala Chai': '/optimized/Ginger Tea.png',
      
      // Cold Beverages
      'Amul Chaas': '/optimized/Amul Chaas.png',
      'Amul Lassi': '/optimized/Amul Lassi.png',
      'Coca Cola': '/optimized/Coca Cola.png',
      
      // Breakfast Items
      'Masala Oats': '/optimized/Masala Oats.png',
      'MTR Poha': '/optimized/MTR Poha.png',
      'MTR Upma': '/optimized/MTR Upma.png',
      'Besan Chila': '/optimized/Besan Chila.png',
      
      // Maggi Varieties
      'Plain Maggi': '/optimized/Plain Maggi.png',
      'Veg Butter Maggi': '/optimized/Veg butter maggi.png',
      'Cheese Maggi': '/optimized/Cheese Maggi.png',
      'Veg Cheese Maggi': '/optimized/Veg cheese maggi.png',
      'Butter Atta Maggi': '/optimized/Butter Atta Maggi.png',
      'Cheese Atta Maggi': '/optimized/Cheese Atta Maggi.png',
      
      // Sandwiches
      'Aloo Sandwich': '/optimized/Aloo sandwich.png',
      'Veg Cheese Sandwich': '/optimized/Veg Cheese Sandwich.png',
      'Aloo Cheese Sandwich': '/optimized/Aloo cheese sandwich.png',
      
      // Snacks
      'Bhel Puri': '/optimized/Bhel Puri.png',
      'Fatafat Bhel': '/optimized/Fatafat Bhel.png',
      'Popcorn': '/optimized/Popcorn.png',
      'Salted Peanuts': '/optimized/Salted Peanuts.png',
      'Aloo Bhujia': '/optimized/Aloo Bhujia.png',
      'Lite Mixture': '/optimized/Lite Mixture.png',
      'Pass Pass': '/optimized/Pass Pass.png',
      
      // Biscuits
      'Parle G Biscuit': '/optimized/Parle G Biscuit.png',
      'Good Day Biscuit': '/optimized/Good Day Biscuit.png',
      'Bourbon Biscuits': '/optimized/Bourbon Biscuits.png',
      
      // Other Items
      'Pasta': '/optimized/Pasta.png',
      'Mix Salad': '/optimized/Mix Salad.png',
      'Cucumber': '/optimized/Cucumber.png',
      'Onion': '/optimized/Onion.png',
      'Gud': '/optimized/Gud.png',
      'Sauf': '/optimized/Sauf.png',
      'Heeng Chana': '/optimized/Heeng Chana.png',
      'Moong Dal': '/optimized/Moong Dal.png',
      'Cheese': '/optimized/Cheese.png'
    }
    
    return menuItemImages[itemName] || null
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
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction('accept')}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept
              </div>
            </button>
            <button
              onClick={() => handleAction('cancel')}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </div>
            </button>
          </div>
        );
      case 'accepted':
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
      case 'cancelled':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction('accept')}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept
              </div>
            </button>
            <button
              onClick={() => handleAction('delete')}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </div>
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Compact Header - Customer Name First */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            {/* User Profile Photo or Initials */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-200 flex items-center justify-center flex-shrink-0">
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
            
            {/* Customer Info with Subtext */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900 truncate">{order.user?.name || 'Unknown User'}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
                  {getStatusText(status)}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-x-2">
                <span>#{getDisplayOrderId(order)}</span>
                <span>•</span>
                <span className="truncate">{order.user?.email || 'No email'}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold text-gray-900">₹{order.order_amount || order.total || 0}</p>
            <p className="text-xs text-gray-500">{formatDateTime(order.created_at || order.timestamp)}</p>
          </div>
        </div>
      </div>

                {/* Order Items - Matching User Side Style */}
          <div className="px-4 py-3">
            <div className="space-y-3">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {/* Item Image */}
                        {(() => {
                          const imagePath = item.image || getMenuItemImage(item.name || item.item_name)
                          return imagePath && imagePath.startsWith('/') ? (
                            <img 
                              src={imagePath} 
                              alt={item.name || item.item_name}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'block'
                              }}
                            />
                          ) : null
                        })()}
                        <span 
                          className="text-2xl" 
                          style={{ 
                            display: (item.image || getMenuItemImage(item.name || item.item_name)) && 
                                    (item.image || getMenuItemImage(item.name || item.item_name)).startsWith('/') ? 'none' : 'block' 
                          }}
                        >
                          {item.image || getMenuItemImage(item.name || item.item_name) || '🍽️'}
                        </span>
                        
                        {/* Item Details */}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name || item.item_name}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            <p className="text-xs text-gray-500">• ₹{item.price} each</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Item Total Price */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">₹{item.item_amount || (item.price * item.quantity)}</p>
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
