import { useState, useEffect, useRef } from 'react';
import DateRangeSelector from './DateRangeSelector';
import { useStaffOrders } from '../contexts/StaffOrderContext';
import { 
  ChevronUpDownIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  UserIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function CompletedOrdersTable({ orders, loading, error }) {
  // Note: Only orders with status 'completed' are passed to this component
  // These orders have already gone through the full flow:
  // pending -> accepted (payment confirmed) -> ready -> completed (delivered/picked up)
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({
    customer: '',
    amount: '',
    date: '',
    items: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const { moveToPending, moveToAccepted, moveToCancelled } = useStaffOrders();

  useEffect(() => {
    if (orders && orders.length > 0) {
      filterOrders();
    } else {
      setFilteredOrders([]);
    }
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, startDate, endDate, filters, sortConfig]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is inside any dropdown
      const isClickInside = Object.values(dropdownRefs.current).some(ref => 
        ref && ref.contains(event.target)
      );
      
      // Also check if the click is on a dropdown action button
      const isDropdownAction = event.target.closest('[data-dropdown-action]');
      
      if (!isClickInside && !isDropdownAction) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleAction = async (orderId, action) => {
    console.log('CompletedOrdersTable: handleAction called with:', { orderId, action });
    console.log('CompletedOrdersTable: Order ID type:', typeof orderId);
    console.log('CompletedOrdersTable: Order ID value:', orderId);
    
    // Close dropdown immediately to prevent interference
    setShowDropdown(null);
    
    try {
      let result;
      switch (action) {
        case 'pending':
          console.log('CompletedOrdersTable: Calling moveToPending for order:', orderId);
          result = await moveToPending(orderId);
          break;
        case 'accepted':
          console.log('CompletedOrdersTable: Calling moveToAccepted for order:', orderId);
          result = await moveToAccepted(orderId);
          break;
        case 'cancelled':
          console.log('CompletedOrdersTable: Calling moveToCancelled for order:', orderId);
          result = await moveToCancelled(orderId);
          break;
        default:
          console.error('CompletedOrdersTable: Unknown action:', action);
          return;
      }

      console.log('CompletedOrdersTable: Action result:', result);

      if (result.success) {
        console.log(`CompletedOrdersTable: Order ${orderId} moved to ${action}`);
        // The order will be automatically removed from completed orders
        // and moved to the appropriate tab via real-time updates
      } else {
        console.error('CompletedOrdersTable: Failed to move order:', result.error);
        alert('Failed to move order. Please try again.');
      }
    } catch (error) {
      console.error('CompletedOrdersTable: Error moving order:', error);
      alert('An error occurred while moving the order.');
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Date range filtering
    if (startDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        const start = new Date(startDate);
        return orderDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        return orderDate <= end;
      });
    }

    // Column filtering
    if (filters.orderDetails) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(filters.orderDetails.toLowerCase())
      );
    }

    if (filters.customer) {
      filtered = filtered.filter(order => 
        order.user?.name?.toLowerCase().includes(filters.customer.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(filters.customer.toLowerCase())
      );
    }

    if (filters.amount) {
      filtered = filtered.filter(order => 
        order.order_amount?.toString().includes(filters.amount)
      );
    }



    if (filters.date) {
      filtered = filtered.filter(order => 
        formatDate(order.created_at).toLowerCase().includes(filters.date.toLowerCase())
      );
    }

    if (filters.items) {
      filtered = filtered.filter(order => {
        const itemsText = order.items?.map(item => `${item.item_name} x ${item.quantity}`).join(' ') || '';
        return itemsText.toLowerCase().includes(filters.items.toLowerCase());
      });
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'orderDetails':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'items':
            aValue = a.items?.length || 0;
            bValue = b.items?.length || 0;
            break;
          case 'customer':
            aValue = a.user?.name || '';
            bValue = b.user?.name || '';
            break;
          case 'amount':
            aValue = a.order_amount || 0;
            bValue = b.order_amount || 0;
            break;

          case 'date':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredOrders(filtered);
  };

  const downloadCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to download for the selected date range.');
      return;
    }

    const headers = [
      'Order ID',
      'Customer Name',
      'Order Items',
      'Total Amount',
      'Order Date',
      'Completion Date',
      'Status'
    ];

    const csvData = filteredOrders.map(order => [
      order.id,
      order.user?.name || 'N/A',
      formatOrderItems(order.items),
      `₹${order.order_amount || 0}`,
      new Date(order.created_at).toLocaleString('en-IN'),
      new Date(order.updated_at).toLocaleString('en-IN'),
      order.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `completed_orders_${startDate || 'all'}_${endDate || 'all'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      orderDetails: '',
      customer: '',
      amount: '',
      date: '',
      items: ''
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 text-orange-500" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 text-orange-500" />
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const formatOrderItems = (items) => {
    if (!items || items.length === 0) return 'No items';
    
    return items.map(item => 
      `${item.item_name} x ${item.quantity}`
    ).join(', ');
  };

  // Calculate statistics based only on date range filters
  const calculateStats = () => {
    if (!orders || orders.length === 0) {
      return {
        totalSales: 0,
        totalOrders: 0,
        mostOrderedItem: null,
        topCustomer: null
      };
    }

    // Apply only date range filters for statistics
    let dateFilteredOrders = [...orders];

    if (startDate) {
      dateFilteredOrders = dateFilteredOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        const start = new Date(startDate);
        return orderDate >= start;
      });
    }

    if (endDate) {
      dateFilteredOrders = dateFilteredOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        return orderDate <= end;
      });
    }

    if (dateFilteredOrders.length === 0) {
      return {
        totalSales: 0,
        totalOrders: 0,
        mostOrderedItem: null,
        topCustomer: null
      };
    }

    // Calculate total sales
    const totalSales = dateFilteredOrders.reduce((sum, order) => sum + (order.order_amount || 0), 0);
    const totalOrders = dateFilteredOrders.length;

    // Find most ordered item
    const itemStats = {};
    dateFilteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const itemName = item.item_name;
        if (!itemStats[itemName]) {
          itemStats[itemName] = { count: 0, totalAmount: 0 };
        }
        itemStats[itemName].count += item.quantity;
        itemStats[itemName].totalAmount += (item.price || 0) * item.quantity;
      });
    });

    const mostOrderedItem = Object.entries(itemStats)
      .sort(([,a], [,b]) => {
        // First sort by count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // If counts are equal, sort by total amount (descending)
        return b.totalAmount - a.totalAmount;
      })[0];

    // Find top customer
    const customerOrders = {};
    dateFilteredOrders.forEach(order => {
      const customerName = order.user?.name || 'Unknown';
      customerOrders[customerName] = (customerOrders[customerName] || 0) + 1;
    });

    const topCustomer = Object.entries(customerOrders)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalSales,
      totalOrders,
      mostOrderedItem: mostOrderedItem ? { name: mostOrderedItem[0], count: mostOrderedItem[1].count } : null,
      topCustomer: topCustomer ? { name: topCustomer[0], orders: topCustomer[1] } : null
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-2">Connection Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards - Hidden on Mobile */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Sales */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Sales</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900">{formatCurrency(stats.totalSales)}</p>
              </div>
            </div>
          </div>

                  {/* Most Ordered Item */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Most Ordered</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  {stats.mostOrderedItem ? `${stats.mostOrderedItem.name} (${stats.mostOrderedItem.count})` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Top Customer */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Top Customer</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  {stats.topCustomer ? `${stats.topCustomer.name} (${stats.topCustomer.orders} orders)` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
      </div>

      {/* Table Card */}
      <div className="sm:bg-white sm:rounded-lg sm:shadow-sm sm:border sm:border-gray-200 overflow-hidden">
        {/* Date Range Selector - Hidden on Mobile */}
        <div className="hidden sm:block border-b border-gray-200 p-3 sm:p-4">
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onDownload={downloadCSV}
            downloadDisabled={filteredOrders.length === 0}
            downloadCount={filteredOrders.length}
            className="shadow-none bg-transparent p-0"
          />
        </div>
        
        {/* Orders Table */}
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed orders</h3>
            <p className="text-gray-500">
              {startDate || endDate ? 'No orders found for the selected date range.' : 'No completed orders yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View - Direct on Background */}
            <div className="block sm:hidden">
              <div className="space-y-4">
                {currentOrders.map((order) => (
                  <div key={order.id} className="p-4 relative bg-white rounded-lg border border-gray-200">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">#{order.id.slice(-8)}</h3>
                        <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.order_amount || 0)}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{order.user?.email || 'N/A'}</p>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-1">Order Items:</p>
                      <p className="text-sm text-gray-900">{formatOrderItems(order.items)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <div className="relative z-10" ref={el => dropdownRefs.current[order.id] = el}>
                        <button
                          onClick={() => {
                            console.log('Mobile dropdown clicked for order:', order.id);
                            setShowDropdown(showDropdown === order.id ? null : order.id);
                          }}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {showDropdown === order.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                data-dropdown-action
                                onClick={() => handleAction(order.supabase_id || order.id, 'pending')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center"
                              >
                                <ClockIcon className="w-4 h-4 mr-2" />
                                Mark as Pending
                              </button>
                              <button
                                data-dropdown-action
                                onClick={() => handleAction(order.supabase_id || order.id, 'accepted')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center"
                              >
                                <CheckIcon className="w-4 h-4 mr-2" />
                                Mark as Accepted
                              </button>
                              <button
                                data-dropdown-action
                                onClick={() => handleAction(order.supabase_id || order.id, 'cancelled')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center"
                              >
                                <XMarkIcon className="w-4 h-4 mr-2" />
                                Mark as Cancelled
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Order Details</span>
                      <button
                        onClick={() => handleSort('orderDetails')}
                        className="ml-2 hover:text-orange-500 transition-colors"
                      >
                        {getSortIcon('orderDetails')}
                      </button>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Customer</span>
                      <button
                        onClick={() => handleSort('customer')}
                        className="ml-2 hover:text-orange-500 transition-colors"
                      >
                        {getSortIcon('customer')}
                      </button>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Order Items</span>
                      <button
                        onClick={() => handleSort('items')}
                        className="ml-2 hover:text-orange-500 transition-colors"
                      >
                        {getSortIcon('items')}
                      </button>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Amount</span>
                      <button
                        onClick={() => handleSort('amount')}
                        className="ml-2 hover:text-orange-500 transition-colors"
                      >
                        {getSortIcon('amount')}
                      </button>
                    </div>
                  </th>

                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Date</span>
                      <button
                        onClick={() => handleSort('date')}
                        className="ml-2 hover:text-orange-500 transition-colors"
                      >
                        {getSortIcon('date')}
                      </button>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span>Actions</span>
                  </th>
                </tr>
                {/* Filter Row */}
                <tr className="bg-gray-100">
                  <th className="px-3 sm:px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by ID..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.orderDetails || ''}
                      onChange={(e) => handleFilterChange('orderDetails', e.target.value)}
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by name/email..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.customer}
                      onChange={(e) => handleFilterChange('customer', e.target.value)}
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by items..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.items}
                      onChange={(e) => handleFilterChange('items', e.target.value)}
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by amount..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.amount}
                      onChange={(e) => handleFilterChange('amount', e.target.value)}
                    />
                  </th>

                  <th className="px-3 sm:px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by date..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.date}
                      onChange={(e) => handleFilterChange('date', e.target.value)}
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-2">
                    {/* No filter for actions column */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.id.slice(-8)}</div>
                      <div className="text-sm text-gray-500">
                        {order.items?.length || 0} items
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.user?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatOrderItems(order.items)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.order_amount || 0)}
                      </div>
                    </td>

                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="relative" ref={el => dropdownRefs.current[order.id] = el}>
                        <button
                          onClick={() => setShowDropdown(showDropdown === order.id ? null : order.id)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {showDropdown === order.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                data-dropdown-action
                                onClick={() => handleAction(order.supabase_id || order.id, 'pending')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center"
                              >
                                <ClockIcon className="w-4 h-4 mr-2" />
                                Mark as Pending
                              </button>
                              <button
                                data-dropdown-action
                                onClick={() => handleAction(order.supabase_id || order.id, 'accepted')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center"
                              >
                                <CheckIcon className="w-4 h-4 mr-2" />
                                Mark as Accepted
                              </button>
                              <button
                                data-dropdown-action
                                onClick={() => handleAction(order.supabase_id || order.id, 'cancelled')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center"
                              >
                                <XMarkIcon className="w-4 h-4 mr-2" />
                                Mark as Cancelled
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </>
          )}

        {/* Table Footer with Pagination */}
        {filteredOrders.length > 0 && (
          <div className="px-3 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Results Counter */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
                </span>
                {(filters.orderDetails || filters.customer || filters.amount || filters.date || filters.items) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === page
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
