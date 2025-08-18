import { useState, useEffect } from 'react';
import DateRangeSelector from './DateRangeSelector';

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

  useEffect(() => {
    if (orders && orders.length > 0) {
      filterOrders();
    } else {
      setFilteredOrders([]);
    }
  }, [orders, startDate, endDate, filters, sortConfig]);

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
      'Phone',
      'Total Amount',
      'Order Date',
      'Completion Date',
      'Status'
    ];

    const csvData = filteredOrders.map(order => [
      order.id,
      order.user?.name || 'N/A',
      formatOrderItems(order.items),
      'N/A', // Phone not available in current schema
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
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const formatOrderItems = (items) => {
    if (!items || items.length === 0) return 'No items';
    
    return items.map(item => 
      `${item.item_name} x ${item.quantity}`
    ).join(', ');
  };

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
    <div className="space-y-6">
      {/* Unified Card with Date Range and Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Date Range Selector */}
        <div className="p-6 border-b border-gray-200">
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
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
            {(filters.orderDetails || filters.customer || filters.amount || filters.payment || filters.date) && (
              <button
                onClick={clearFilters}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed orders</h3>
            <p className="text-gray-500">
              {startDate || endDate ? 'No orders found for the selected date range.' : 'No completed orders yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                </tr>
                {/* Filter Row */}
                <tr className="bg-gray-100">
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by ID..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.orderDetails || ''}
                      onChange={(e) => handleFilterChange('orderDetails', e.target.value)}
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by name/email..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.customer}
                      onChange={(e) => handleFilterChange('customer', e.target.value)}
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by items..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.items}
                      onChange={(e) => handleFilterChange('items', e.target.value)}
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by amount..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.amount}
                      onChange={(e) => handleFilterChange('amount', e.target.value)}
                    />
                  </th>

                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Filter by date..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={filters.date}
                      onChange={(e) => handleFilterChange('date', e.target.value)}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.id.slice(-8)}</div>
                      <div className="text-sm text-gray-500">
                        {order.items?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.user?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatOrderItems(order.items)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.order_amount || 0)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
