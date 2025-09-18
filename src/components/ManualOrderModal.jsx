import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { createOrder } from '../services/supabaseService';
import { getAllUsers } from '../services/supabaseService';
import { menuService } from '../services/menuService';

const ManualOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  
  // Form state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [userSearch, setUserSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  
  // UI state
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  
  const userDropdownRef = useRef(null);
  const itemDropdownRef = useRef(null);

  // Payment mode options
  const paymentModes = ['Cash', 'UPI', 'Pay Later'];

  // Load users and menu items when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadMenuItems();
    }
  }, [isOpen]);

  // Handle viewport height for mobile browsers
  useEffect(() => {
    if (!isOpen) return;

    const updateViewportHeight = () => {
      // Use the actual viewport height
      const vh = window.innerHeight * 0.01;
      setViewportHeight(`${window.innerHeight}px`);
    };

    // Set initial height
    updateViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, [isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.users || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const result = await menuService.getAllMenuItems();
      if (result.success) {
        setMenuItems(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.emailid?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredMenuItems = menuItems.filter(item =>
    item.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.category?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    const getUserRole = (user) => {
      if (user.is_admin) return 'Admin';
      if (user.is_staff) return 'Staff';
      return 'Customer';
    };
    const role = getUserRole(user);
    setUserSearch(`${user.name} (${user.emailid}) - ${role}`);
    setShowUserDropdown(false);
  };

  const handleItemToggle = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(selected => selected.id === item.id);
      if (exists) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const handleQuantityChange = (itemId, quantity) => {
    if (quantity < 1) return;
    
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isFormValid = () => {
    return selectedUser && selectedItems.length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    try {
      setSubmitting(true);

      // Prepare order data - encode staff info in notes field
      const staffInfo = {
        placed_by_staff: true,
        payment_mode: paymentMode,
        staff_placed: true
      };
      
      const orderData = {
        user_id: selectedUser.id,
        order_amount: calculateTotal(),
        status: 'accepted', // Skip pending status
        notes: `STAFF_ORDER:${JSON.stringify(staffInfo)}|Order placed by staff. Payment: ${paymentMode}`,
        items: selectedItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const result = await createOrder(orderData);

      if (result.success) {
        onSuccess(selectedUser.name);
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating manual order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedItems([]);
    setPaymentMode('Cash');
    setUserSearch('');
    setItemSearch('');
    setShowUserDropdown(false);
    setShowItemDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div 
        className="bg-white rounded-none sm:rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col"
        style={{
          height: viewportHeight,
          maxHeight: viewportHeight,
          minHeight: viewportHeight
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 flex-shrink-0 bg-white relative z-10">
          <h2 className="text-xl font-semibold text-gray-900">Place Order for Customer</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer *
            </label>
            <div className="relative" ref={userDropdownRef}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(true);
                    if (!e.target.value) setSelectedUser(null);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              {showUserDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => {
                      const getUserRole = (user) => {
                        if (user.is_admin) return { label: 'Admin', color: 'bg-red-100 text-red-800' };
                        if (user.is_staff) return { label: 'Staff', color: 'bg-blue-100 text-blue-800' };
                        return { label: 'Customer', color: 'bg-green-100 text-green-800' };
                      };
                      
                      const role = getUserRole(user);
                      
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.emailid}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${role.color}`}>
                              {role.label}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No users found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu Items Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Menu Items *
            </label>
            <div className="relative" ref={itemDropdownRef}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  placeholder="Search menu items..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              {showItemDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredMenuItems.length > 0 ? (
                    filteredMenuItems.map(item => {
                      const isSelected = selectedItems.find(selected => selected.id === item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemToggle(item)}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                            isSelected ? 'bg-orange-50' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.category} - ₹{item.price}</div>
                          </div>
                          {isSelected && <CheckIcon className="w-5 h-5 text-orange-500" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No items found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Items
              </label>
              <div className="space-y-2">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">₹{item.price} each</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            >
              {paymentModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          {/* Total */}
          {selectedItems.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-orange-600">₹{calculateTotal()}</span>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-3 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0 relative z-10">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualOrderModal;
