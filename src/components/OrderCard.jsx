import { useState, useEffect, useRef } from 'react';
import { useStaffOrders } from '../contexts/StaffOrderContext';
import { getDisplayOrderId, getDatabaseOrderId } from '../utils/orderUtils';
import { updateOrderStatus } from '../services/supabaseService';
import DeleteOrderModal from './DeleteOrderModal';
import { 
  CheckIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  TrashIcon,
  InboxIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function OrderCard({ order, status }) {
  const { acceptOrder, completeOrder, cancelOrder, deleteOrder } = useStaffOrders();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef(null);

  // Debug: Log order object structure
  useEffect(() => {
    console.log('OrderCard: Order object received:', {
      id: order.id,
      supabase_id: order.supabase_id,
      custom_order_id: order.custom_order_id,
      status: order.status,
      order_amount: order.order_amount
    });
    
    // Debug: Log user data specifically
    console.log('OrderCard: User data:', {
      name: order.user?.name,
      email: order.user?.email,
      photoURL: order.user?.photoURL,
      hasPhoto: !!order.user?.photoURL
    });
  }, [order]);

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
    if (!itemName) return null;
    
    // Normalize the item name for better matching
    const normalizedName = itemName.trim();
    
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
      'Aloo Bhujiya': '/optimized/Aloo Bhujia.png', // Handle spelling variation
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
    
    // Try exact match first
    let imagePath = menuItemImages[normalizedName];
    
    // If not found, try case-insensitive match
    if (!imagePath) {
      const lowerName = normalizedName.toLowerCase();
      for (const [key, value] of Object.entries(menuItemImages)) {
        if (key.toLowerCase() === lowerName) {
          imagePath = value;
          break;
        }
      }
    }
    
    // Debug logging
    if (!imagePath) {
      console.log('OrderCard: No image found for item:', normalizedName);
    }
    
    return imagePath || null
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
              <CheckIcon className="w-4 h-4 mr-1 sm:mr-2" />
              Accept Order
            </div>
          </button>
          <button
            onClick={() => handleAction('cancel')}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <div className="flex items-center justify-center">
              <XMarkIcon className="w-4 h-4 mr-1 sm:mr-2" />
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
            <CheckIcon className="w-4 h-4 mr-1 sm:mr-2" />
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
        <div className="px-3 sm:px-4 py-3 border-b bg-white border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2 sm:gap-3">
              {/* User Profile Photo or Initials */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 flex items-center justify-center flex-shrink-0 bg-gray-100 border-gray-200">
                {order.user?.photoURL ? (
                  <img 
                    src={order.user.photoURL} 
                    alt={order.user?.name || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide the image and show initials when photo fails to load
                      e.target.style.display = 'none';
                      const initialsDiv = e.target.nextElementSibling;
                      if (initialsDiv) {
                        initialsDiv.style.display = 'flex';
                      }
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
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border w-fit ${getStatusColor(status)}`}>
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
                      <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
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
                                <CheckIcon className="w-4 h-4 mr-2" />
                                Accept Order
                              </button>
                              <button
                                onClick={() => {
                                  handleAction('cancel');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center"
                              >
                                <XMarkIcon className="w-4 h-4 mr-2" />
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
                                <ClockIcon className="w-4 h-4 mr-2" />
                                Mark as Pending
                              </button>
                              <button
                                onClick={() => {
                                  handleAction('cancel');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center"
                              >
                                <XMarkIcon className="w-4 h-4 mr-2" />
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
                                <CheckIcon className="w-4 h-4 mr-2" />
                                Accept Order
                              </button>
                              <button
                                onClick={() => {
                                  handleAction('delete');
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center"
                              >
                                <TrashIcon className="w-4 h-4 mr-2" />
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
                <InboxIcon className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                <p className="text-xs">No items available</p>
              </div>
            )}
          </div>
        </div>

        {/* Compact Order Notes */}
        {order.notes && (
          <div className="px-3 sm:px-4 py-2 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4 text-orange-600" />
              <span className="text-orange-800 font-medium text-sm">Special instructions:</span>
              <span className="text-xs text-gray-700">{order.notes}</span>
            </div>
          </div>
        )}

        {/* Compact Action Button */}
        <div className="px-3 sm:px-4 py-3 bg-white">
          {renderActionButton()}
        </div>
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
