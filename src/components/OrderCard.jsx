import { useState, useEffect, useRef } from 'react';
import { useStaffOrders } from '../contexts/StaffOrderContext';
import { getDisplayOrderId, getDatabaseOrderId } from '../utils/orderUtils';
import { updateOrderStatus } from '../services/supabaseService';
import DeleteOrderModal from './DeleteOrderModal';

export default function OrderCard({ order, status }) {
  const { acceptOrder, completeOrder, cancelOrder, deleteOrder } = useStaffOrders();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        case 'pending':
          console.log(`OrderCard: Calling updateOrderStatus to pending for order ${orderIdForUpdate}`);
          result = await updateOrderStatus(orderIdForUpdate, 'pending');
          console.log(`OrderCard: updateOrderStatus to pending result:`, result);
          break;
        case 'delete':
          // Show delete confirmation modal instead of deleting immediately
          setShowDeleteModal(true);
          setShowDropdown(false);
          return; // Don't proceed with deletion yet
        default:
          break;
      }
      
      if (!result?.success) {
        console.error(`OrderCard: ${action} action failed:`, result?.error);
        alert(result?.error || 'Action failed. Please try again.');
      } else {
        console.log(`OrderCard: ${action} action completed successfully`);
      }
    } catch (error) {
      console.error(`OrderCard: Error performing ${action} action:`, error);
      alert('Action failed. Please try again.');
    } finally {
      // No loading state needed
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      console.log('OrderCard: handleDeleteConfirm called with order:', order);
      
      const orderIdForUpdate = getDatabaseOrderId(order);
      console.log(`OrderCard: getDatabaseOrderId returned: ${orderIdForUpdate}`);
      console.log(`OrderCard: order object structure:`, {
        id: order.id,
        supabase_id: order.supabase_id,
        custom_order_id: order.custom_order_id
      });
      
      if (!orderIdForUpdate) {
        console.error('OrderCard: No valid order ID found for deletion');
        alert('Error: Could not identify order for deletion');
        return;
      }
      
      console.log(`OrderCard: Confirming delete for order ${orderIdForUpdate}`);
      
      const result = await deleteOrder(orderIdForUpdate);
      console.log(`OrderCard: deleteOrder result:`, result);
      
      if (!result?.success) {
        console.error(`OrderCard: Delete action failed:`, result?.error);
        alert(result?.error || 'Delete failed. Please try again.');
      } else {
        console.log(`OrderCard: Delete action completed successfully`);
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error(`OrderCard: Error deleting order:`, error);
      alert('Delete failed. Please try again.');
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

    // Show Accept/Reject buttons for pending orders
    if (status === 'pending') {
      return (
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <button
            onClick={() => handleAction('accept')}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept Order
            </div>
          </button>
          <button
            onClick={() => handleAction('cancel')}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Order
            </div>
          </button>
        </div>
      );
    }

    // Show Complete Order button only for accepted orders
    if (status === 'accepted') {
      return (
        <button
          onClick={() => handleAction('complete')}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Complete Order
          </div>
        </button>
      );
    }

    return null;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Compact Header - Customer Name First */}
        <div className={`px-3 sm:px-4 py-3 border-b ${status === 'accepted' ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2 sm:gap-3">
              {/* User Profile Photo or Initials */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 flex items-center justify-center flex-shrink-0 ${status === 'accepted' ? 'bg-blue-100 border-blue-200' : 'bg-orange-100 border-orange-200'}`}>
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{order.user?.name || 'Unknown User'}</h3>
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
              <div className="flex items-center justify-end gap-2">
                <div>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">₹{order.order_amount || order.total || 0}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.created_at || order.timestamp)}</p>
                </div>
                {/* Three-dot menu for status changes */}
                {(status === 'accepted' || status === 'cancelled') && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {showDropdown && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  handleAction('accept');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accept Order
                              </button>
                              <button
                                onClick={() => {
                                  handleAction('cancel');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel Order
                              </button>
                            </>
                          )}
                          
                          {status === 'accepted' && (
                            <>
                              <button
                                onClick={() => {
                                  handleAction('pending');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Mark as Pending
                              </button>
                              <button
                                onClick={() => {
                                  handleAction('cancel');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel Order
                              </button>
                            </>
                          )}
                          
                          {status === 'cancelled' && (
                            <>
                              <button
                                onClick={() => {
                                  handleAction('accept');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accept Order
                              </button>
                              <button
                                onClick={() => {
                                  handleAction('delete');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Order
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items - Matching User Side Style */}
        <div className="px-3 sm:px-4 py-3">
          <div className="space-y-3">
            {Array.isArray(order.items) && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {/* Item Image */}
                      {(() => {
                        const imagePath = item.image || getMenuItemImage(item.name || item.item_name)
                        return imagePath && imagePath.startsWith('/') ? (
                          <img 
                            src={imagePath} 
                            alt={item.name || item.item_name}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'block'
                            }}
                          />
                        ) : null
                      })()}
                      <span 
                        className="text-xl sm:text-2xl" 
                        style={{ 
                          display: (item.image || getMenuItemImage(item.name || item.item_name)) && 
                                  (item.image || getMenuItemImage(item.name || item.item_name)).startsWith('/') ? 'none' : 'block' 
                        }}
                      >
                        {item.image || getMenuItemImage(item.name || item.item_name) || '🍽️'}
                      </span>
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.name || item.item_name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-xs text-gray-500">₹{item.price} each</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Item Total Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">₹{item.item_amount || (item.price * item.quantity)}</p>
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
        <div className="px-3 sm:px-4 py-3 bg-white">
          {renderActionButton()}
        </div>

        {/* Compact Order Notes */}
        {order.notes && (
          <div className="px-3 sm:px-4 py-2 bg-yellow-50 border-t border-yellow-200">
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

      {/* Delete Confirmation Modal */}
      <DeleteOrderModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        order={order}
      />
    </>
  );
}
