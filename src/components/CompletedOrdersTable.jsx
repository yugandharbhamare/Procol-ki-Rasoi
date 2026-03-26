import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import DateRangeSelector from './DateRangeSelector';
import { useStaffOrders } from '../contexts/StaffOrderContext';
import SimplePagination from './SimplePagination';
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function CompletedOrdersTable({ orders, loading, error }) {
  function TruncatedItemName({ text }) {
    const textRef = useRef(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useLayoutEffect(() => {
      const checkTruncation = () => {
        if (!textRef.current) return;
        setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      };

      checkTruncation();
      window.addEventListener('resize', checkTruncation);
      return () => window.removeEventListener('resize', checkTruncation);
    }, [text]);

    return (
      <div className="relative min-w-0 group/item-name">
        <span ref={textRef} className="block text-sm text-gray-800 truncate">
          {text}
        </span>
        {isTruncated && (
          <div className="pointer-events-none absolute left-0 top-full mt-1 z-30 hidden group-hover/item-name:block">
            <div className="max-w-[220px] whitespace-normal rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
              {text}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Note: Only orders with status 'completed' are passed to this component
  // These orders have already gone through the full flow:
  // pending -> accepted (payment confirmed) -> ready -> completed (delivered/picked up)
  const [filteredOrders, setFilteredOrders] = useState([]);
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  // Multi-select filters: each key holds a Set of selected values
  const [filters, setFilters] = useState({
    customer: new Set(),
    items: new Set()
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('customer');
  const [filterSearch, setFilterSearch] = useState('');
  // Staged filters: edits happen here, applied only on "Apply"
  const [stagedFilters, setStagedFilters] = useState({
    customer: new Set(),
    items: new Set()
  });
  const [salesView, setSalesView] = useState('item');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const filterPanelRef = useRef(null);
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

  // Close filter panel on outside click
  useEffect(() => {
    const handleFilterClickOutside = (e) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
        setShowFilterPanel(false);
      }
    };
    if (showFilterPanel) {
      document.addEventListener('mousedown', handleFilterClickOutside);
      return () => document.removeEventListener('mousedown', handleFilterClickOutside);
    }
  }, [showFilterPanel]);

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

    // Multi-select filtering
    if (filters.customer.size > 0) {
      filtered = filtered.filter(order => {
        const name = order.user?.name || 'Unknown';
        return filters.customer.has(name);
      });
    }

    if (filters.items.size > 0) {
      filtered = filtered.filter(order => {
        const orderItems = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
        return orderItems.some(item => filters.items.has(item.item_name || item.name || ''));
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
            aValue = Array.isArray(a.items) ? a.items.length : Object.keys(a.items || {}).length;
            bValue = Array.isArray(b.items) ? b.items.length : Object.keys(b.items || {}).length;
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

  const clearFilters = () => {
    setFilters({ customer: new Set(), items: new Set() });
    setStagedFilters({ customer: new Set(), items: new Set() });
  };

  const activeFilterCount = filters.customer.size + filters.items.size;

  // Build unique filter options from date-filtered orders
  const getFilterOptions = () => {
    let dateFiltered = [...(orders || [])];
    if (startDate) {
      dateFiltered = dateFiltered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= new Date(startDate);
      });
    }
    if (endDate) {
      dateFiltered = dateFiltered.filter(order => {
        const orderDate = new Date(order.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orderDate <= end;
      });
    }

    const customers = new Map();
    const items = new Map();

    dateFiltered.forEach(order => {
      const name = order.user?.name || 'Unknown';
      customers.set(name, (customers.get(name) || 0) + 1);

      const orderItems = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
      orderItems.forEach(item => {
        const itemName = item.item_name || item.name || '';
        if (itemName) items.set(itemName, (items.get(itemName) || 0) + 1);
      });
    });

    return {
      customer: [...customers.entries()].sort((a, b) => b[1] - a[1]),
      items: [...items.entries()].sort((a, b) => b[1] - a[1])
    };
  };

  const filterOptions = getFilterOptions();

  const FILTER_TABS = [
    { key: 'customer', label: 'Customer' },
    { key: 'items', label: 'Items' }
  ];

  const toggleStagedFilter = (category, value) => {
    setStagedFilters(prev => {
      const newSet = new Set(prev[category]);
      if (newSet.has(value)) newSet.delete(value);
      else newSet.add(value);
      return { ...prev, [category]: newSet };
    });
  };

  const applyFilters = () => {
    setFilters({ ...stagedFilters });
    setShowFilterPanel(false);
  };

  const openFilterPanel = () => {
    // Clone current filters into staged
    setStagedFilters({
      customer: new Set(filters.customer),
      items: new Set(filters.items)
    });
    setFilterSearch('');
    setActiveFilterTab('customer');
    setShowFilterPanel(true);
  };

  const clearStagedFilters = () => {
    setStagedFilters({ customer: new Set(), items: new Set() });
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


  const formatOrderItems = (items) => {
    if (!items || items.length === 0) return 'No items';
    
    return items.map(item => 
      `${item.item_name} x ${item.quantity}`
    ).join(', ');
  };

  // Calculate statistics based only on date range filters
  const calculateStats = () => {
    if (!orders || orders.length === 0) {
      return { totalSales: 0, totalOrders: 0, itemBreakdown: [], customerBreakdown: [] };
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
        end.setHours(23, 59, 59, 999);
        return orderDate <= end;
      });
    }

    if (dateFilteredOrders.length === 0) {
      return { totalSales: 0, totalOrders: 0, itemBreakdown: [], customerBreakdown: [] };
    }

    const totalSales = dateFilteredOrders.reduce((sum, order) => sum + (order.order_amount || 0), 0);
    const totalOrders = dateFilteredOrders.length;

    // Build item-wise breakdown
    const itemStats = {};
    const customerStats = {};
    dateFilteredOrders.forEach(order => {
      const customerName = order.user?.name || 'Unknown';
      if (!customerStats[customerName]) {
        customerStats[customerName] = { orderCount: 0, totalAmount: 0 };
      }
      customerStats[customerName].orderCount += 1;
      customerStats[customerName].totalAmount += Number(order.order_amount || 0);

      order.items?.forEach(item => {
        const itemName = item.item_name || item.name || 'Unknown';
        if (!itemStats[itemName]) {
          itemStats[itemName] = { count: 0, totalAmount: 0 };
        }
        itemStats[itemName].count += item.quantity;
        itemStats[itemName].totalAmount += (item.price || 0) * item.quantity;
      });
    });

    // Sort by totalAmount descending
    const itemBreakdown = Object.entries(itemStats)
      .map(([name, data]) => ({ name, count: data.count, totalAmount: data.totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const customerBreakdown = Object.entries(customerStats)
      .map(([name, data]) => ({ name, orderCount: data.orderCount, totalAmount: data.totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return { totalSales, totalOrders, itemBreakdown, customerBreakdown };
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
      {/* Split Layout: Side Panel (3 cols) + Orders Table (9 cols) */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4">

        {/* Side Panel - Sales Breakdown */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-4 lg:h-[calc(100vh-10rem)] lg:flex lg:flex-col">
            {/* Total Sales Header */}
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalOrders} order{stats.totalOrders !== 1 ? 's' : ''}</p>
            </div>

            {/* Item-wise Breakdown */}
            <div className="p-3 flex-1 min-h-0">
              <div className="mb-3 px-1">
                <div className="flex w-full items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <button
                    onClick={() => setSalesView('item')}
                    className={`flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      salesView === 'item'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                    }`}
                  >
                    Item wise
                  </button>
                  <button
                    onClick={() => setSalesView('customer')}
                    className={`flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      salesView === 'customer'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                    }`}
                  >
                    Customer wise
                  </button>
                </div>
              </div>
              {(salesView === 'item' ? stats.itemBreakdown.length : stats.customerBreakdown.length) === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data</p>
              ) : (
                <div className="-mx-3 px-3 space-y-1 h-full overflow-y-auto pb-16">
                  {(salesView === 'item' ? stats.itemBreakdown : stats.customerBreakdown).map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-medium text-gray-400 w-4 flex-shrink-0">{idx + 1}.</span>
                        <TruncatedItemName text={item.name} />
                        {salesView === 'item' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 flex-shrink-0">
                            {item.count}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 flex-shrink-0">
                            {item.orderCount}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Orders Table (9 cols) */}
        <div className="lg:col-span-9">
      <div className="sm:bg-white sm:rounded-lg sm:shadow-sm sm:border sm:border-gray-200 overflow-hidden lg:h-[calc(100vh-10rem)] lg:overflow-y-auto">
        {/* Toolbar: Date Range + Filter + Download */}
        <div className="hidden sm:block border-b border-gray-200 py-3 sm:py-4 sticky top-0 z-20 bg-white">
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onDownload={downloadCSV}
            downloadDisabled={filteredOrders.length === 0}
            downloadCount={filteredOrders.length}
            className="shadow-none bg-transparent p-0"
          >
            {/* Filter Button */}
            <div className="relative" ref={filterPanelRef}>
              <button
                onClick={openFilterPanel}
                className={`flex items-center gap-2 px-3 py-2 h-10 rounded-lg border transition-colors text-sm font-medium ${
                  activeFilterCount > 0
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter Dropdown Panel */}
              {showFilterPanel && (
                <div className="absolute left-0 top-12 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-[420px] overflow-hidden">
                  <div className="flex h-[340px]">
                    {/* Left sidebar - filter categories */}
                    <div className="w-[140px] border-r border-gray-100 bg-gray-50 py-2">
                      {FILTER_TABS.map(tab => {
                        const count = stagedFilters[tab.key].size;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => { setActiveFilterTab(tab.key); setFilterSearch(''); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                              activeFilterTab === tab.key
                                ? 'text-orange-600 bg-white font-medium border-r-2 border-orange-500'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span>{tab.label}</span>
                            <div className="flex items-center gap-1">
                              {count > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full">
                                  {count}
                                </span>
                              )}
                              <ChevronRightIcon className={`w-3 h-3 ${activeFilterTab === tab.key ? 'text-orange-500' : 'text-gray-400'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right panel - options */}
                    <div className="flex-1 flex flex-col">
                      {/* Search within options */}
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      {/* Checkbox list */}
                      <div className="flex-1 overflow-y-auto p-1">
                        {(filterOptions[activeFilterTab] || [])
                          .filter(([val]) => val.toLowerCase().includes(filterSearch.toLowerCase()))
                          .map(([val, count]) => (
                            <label
                              key={val}
                              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={stagedFilters[activeFilterTab].has(val)}
                                onChange={() => toggleStagedFilter(activeFilterTab, val)}
                                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 accent-orange-500"
                              />
                              <span className="text-sm text-gray-800 flex-1 truncate">{val}</span>
                              <span className="text-xs text-gray-400">{count}</span>
                            </label>
                          ))
                        }
                        {(filterOptions[activeFilterTab] || [])
                          .filter(([val]) => val.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-6">No matches</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={clearStagedFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Clear all filters
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFilterPanel(false)}
                        className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={applyFilters}
                        className="px-5 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DateRangeSelector>
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
                      <span>Order</span>
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
                      <span>Items</span>
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
                    <span></span>
                  </th>
                </tr>
                {/* Active filter tags row */}
                {activeFilterCount > 0 && (
                <tr className="bg-orange-50">
                  <th colSpan={6} className="px-3 sm:px-6 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Active filters:</span>
                      {[...filters.customer].map(v => (
                        <span key={`c-${v}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-orange-200 text-orange-700 text-xs rounded-full">
                          {v}
                          <button onClick={() => setFilters(prev => { const s = new Set(prev.customer); s.delete(v); return { ...prev, customer: s }; })} className="hover:text-orange-900">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {[...filters.items].map(v => (
                        <span key={`i-${v}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-orange-200 text-orange-700 text-xs rounded-full">
                          {v}
                          <button onClick={() => setFilters(prev => { const s = new Set(prev.items); s.delete(v); return { ...prev, items: s }; })} className="hover:text-orange-900">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button onClick={clearFilters} className="text-xs text-orange-600 hover:text-orange-800 font-medium ml-1">
                        Clear all
                      </button>
                    </div>
                  </th>
                </tr>
                )}
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
          <div className="px-3 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-20">
            <div className="flex items-center justify-between">
              {/* Results Counter */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing {currentOrders.length} of {filteredOrders.length} orders
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Simplified Pagination */}
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                maxVisiblePages={5}
              />
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
