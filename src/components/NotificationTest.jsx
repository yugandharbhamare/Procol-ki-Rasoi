import { useState } from 'react';
import notificationService from '../services/notificationService';

const NotificationTest = () => {
  const [isVisible, setIsVisible] = useState(false);

  const testNotifications = {
    newOrder: () => notificationService.notifyNewOrder('ORD-123', 'John Doe'),
    orderAccepted: () => notificationService.notifyOrderStatusChange('ORD-123', 'accepted', 'Your order has been accepted!'),
    orderReady: () => notificationService.notifyOrderStatusChange('ORD-123', 'completed', 'Your order is ready for pickup!'),
    orderCancelled: () => notificationService.notifyOrderStatusChange('ORD-123', 'cancelled', 'Your order has been cancelled.'),
    testSound: () => notificationService.testNotification()
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-orange-600 transition-colors z-50"
      >
        Test Notifications
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Test Notifications</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={testNotifications.newOrder}
          className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
        >
          🔔 New Order (Staff)
        </button>
        
        <button
          onClick={testNotifications.orderAccepted}
          className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
        >
          ✅ Order Accepted
        </button>
        
        <button
          onClick={testNotifications.orderReady}
          className="w-full text-left px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
        >
          🍽️ Order Ready
        </button>
        
        <button
          onClick={testNotifications.orderCancelled}
          className="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
        >
          ❌ Order Cancelled
        </button>
        
        <button
          onClick={testNotifications.testSound}
          className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
        >
          🔊 Test Sound
        </button>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div>Sound: {notificationService.audioContext ? '✅' : '❌'}</div>
          <div>Vibration: {notificationService.vibrationSupported ? '✅' : '❌'}</div>
          <div>Browser: {'Notification' in window ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;
