import { useState, useEffect } from 'react';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import { useStaffOrders } from '../contexts/StaffOrderContext';
import OrderCard from './OrderCard';
import StaffHeader from './StaffHeader';
import NotificationSound from './NotificationSound';
import CompletedOrdersTable from './CompletedOrdersTable';
import ManualOrderModal from './ManualOrderModal';
import { DocumentTextIcon, ExclamationTriangleIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function StaffDashboard() {
  const { staffUser, signOutUser } = useStaffAuth();
  const { 
    pendingOrders, 
    acceptedOrders, 
    completedOrders,
    cancelledOrders,
    loading, 
    error,
    getOrderCounts 
  } = useStaffOrders();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [showNotifications, setShowNotifications] = useState(true);
  const [playNotification, setPlayNotification] = useState(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const orderCounts = getOrderCounts();

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (orderCounts.pending > 0) {
      const timer = setTimeout(() => {
        setShowNotifications(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderCounts.pending]);

  // Sound notification for new orders
  useEffect(() => {
    if (orderCounts.pending > 0 && showNotifications) {
      setPlayNotification(true);
    }
  }, [orderCounts.pending, showNotifications]);

  const handleNotificationComplete = () => {
    setPlayNotification(false);
  };

  const handleManualOrderSuccess = (userName) => {
    setToastMessage(`Order placed for ${userName}`);
    // Auto-hide toast after 3 seconds
    setTimeout(() => setToastMessage(''), 3000);
  };



  const renderOrders = (orders, status) => {
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
            <p className="text-sm text-gray-500">
              Please check your Supabase configuration and try refreshing the page.
            </p>
          </div>
        </div>
      );
    }

    if (!orders || orders.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {status} orders</h3>
          <p className="text-gray-500">All caught up! Check back later for new orders.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} status={status} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffHeader 
        staffUser={staffUser} 
        onSignOut={signOutUser}
        orderCounts={orderCounts}
        showNotifications={showNotifications}
      />

      {/* Notification Sound */}
      <NotificationSound 
        play={playNotification} 
        onPlayComplete={handleNotificationComplete} 
      />

      {/* Notification Banner */}
      {orderCounts.pending > 0 && showNotifications && (
        <div className="bg-orange-500 text-white px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">
                {orderCounts.pending} new order{orderCounts.pending > 1 ? 's' : ''} awaiting confirmation
              </span>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-white hover:text-orange-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">


        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pt-2 pb-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
              {orderCounts.pending > 0 && (
                <span className="ml-1 sm:ml-2 bg-orange-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                  {orderCounts.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`pt-2 pb-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'accepted'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">In Preparation</span>
              <span className="sm:hidden">Prep</span>
              {orderCounts.accepted > 0 && (
                <span className="ml-1 sm:ml-2 bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                  {orderCounts.accepted}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`pt-2 pb-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'completed'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">Done</span>
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`pt-2 pb-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'cancelled'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Cancelled</span>
              <span className="sm:hidden">Cancelled</span>
              {orderCounts.cancelled > 0 && (
                <span className="ml-1 sm:ml-2 bg-red-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                  {orderCounts.cancelled}
                </span>
              )}
            </button>

          </nav>
        </div>

        {/* Order Content */}
        <div className="space-y-6">
          {activeTab === 'pending' && renderOrders(pendingOrders, 'pending')}
          {activeTab === 'accepted' && renderOrders(acceptedOrders, 'accepted')}
          {activeTab === 'completed' && (
            <CompletedOrdersTable 
              orders={completedOrders} 
              loading={loading} 
              error={error} 
            />
          )}
          {activeTab === 'cancelled' && renderOrders(cancelledOrders, 'cancelled')}

        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowManualOrderModal(true)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-40"
        title="Place order for customer"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {toastMessage}
        </div>
      )}

      {/* Manual Order Modal */}
      <ManualOrderModal
        isOpen={showManualOrderModal}
        onClose={() => setShowManualOrderModal(false)}
        onSuccess={handleManualOrderSuccess}
      />
    </div>
  );
}
