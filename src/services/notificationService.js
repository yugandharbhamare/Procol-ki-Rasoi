/**
 * Notification Service
 * Handles sound notifications and mobile vibration for order status changes
 */

class NotificationService {
  constructor() {
    this.isEnabled = true;
    this.soundEnabled = true;
    this.vibrationEnabled = true;
    this.audioContext = null;
    this.sounds = {};
    
    // Initialize audio context
    this.initAudioContext();
    
    // Check if device supports vibration
    this.vibrationSupported = 'vibrate' in navigator;
    
    // Request notification permission
    this.requestNotificationPermission();
  }

  /**
   * Initialize audio context for sound generation
   */
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.soundEnabled = false;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Notification permission request failed:', error);
      }
    }
  }

  /**
   * Generate notification sound using Web Audio API
   */
  generateNotificationSound(type = 'default') {
    if (!this.soundEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different sound patterns for different notification types
      switch (type) {
        case 'new_order':
          // Double beep for new orders
          this.playBeepPattern(oscillator, gainNode, [800, 0.1, 1000, 0.1]);
          break;
        case 'order_accepted':
          // Rising tone for order accepted
          this.playBeepPattern(oscillator, gainNode, [600, 0.2, 800, 0.2]);
          break;
        case 'order_ready':
          // Triple beep for order ready
          this.playBeepPattern(oscillator, gainNode, [1000, 0.1, 0, 0.05, 1000, 0.1, 0, 0.05, 1000, 0.1]);
          break;
        case 'order_cancelled':
          // Low descending tone for cancellation
          this.playBeepPattern(oscillator, gainNode, [400, 0.3, 300, 0.3]);
          break;
        default:
          // Single beep for default
          this.playBeepPattern(oscillator, gainNode, [800, 0.2]);
      }
    } catch (error) {
      console.warn('Sound generation failed:', error);
    }
  }

  /**
   * Play a beep pattern with specified frequencies and durations
   */
  playBeepPattern(oscillator, gainNode, pattern) {
    let currentTime = this.audioContext.currentTime;
    
    pattern.forEach((value, index) => {
      if (index % 2 === 0) {
        // Frequency
        oscillator.frequency.setValueAtTime(value, currentTime);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + pattern[index + 1]);
      } else {
        // Duration
        currentTime += value;
      }
    });

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + currentTime);
  }

  /**
   * Trigger mobile vibration
   */
  vibrate(pattern = [200, 100, 200]) {
    if (!this.vibrationEnabled || !this.vibrationSupported) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Show browser notification (if permission granted)
   */
  showBrowserNotification(title, body, icon = null) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: icon || '/Staff portal logo.png',
          badge: '/Staff portal logo.png',
          tag: 'order-notification',
          requireInteraction: false,
          silent: false
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        return notification;
      } catch (error) {
        console.warn('Browser notification failed:', error);
      }
    }
  }

  /**
   * Notify for new order (staff)
   */
  notifyNewOrder(orderId, customerName) {
    if (!this.isEnabled) return;

    const title = 'New Order Received!';
    const body = `Order ${orderId} from ${customerName}`;
    
    // Sound notification
    this.generateNotificationSound('new_order');
    
    // Vibration pattern for new orders
    this.vibrate([300, 100, 300, 100, 300]);
    
    // Browser notification
    this.showBrowserNotification(title, body);
    
    console.log('🔔 New order notification:', { orderId, customerName });
  }

  /**
   * Notify for order status change (customer)
   */
  notifyOrderStatusChange(orderId, status, message) {
    if (!this.isEnabled) return;

    const title = 'Order Status Update';
    const body = `Order ${orderId}: ${message}`;
    
    // Sound notification based on status
    let soundType = 'default';
    let vibrationPattern = [200, 100, 200];
    
    switch (status) {
      case 'accepted':
        soundType = 'order_accepted';
        vibrationPattern = [200, 50, 200];
        break;
      case 'completed':
      case 'ready':
        soundType = 'order_ready';
        vibrationPattern = [100, 50, 100, 50, 100];
        break;
      case 'cancelled':
        soundType = 'order_cancelled';
        vibrationPattern = [500];
        break;
    }
    
    // Sound notification
    this.generateNotificationSound(soundType);
    
    // Vibration
    this.vibrate(vibrationPattern);
    
    // Browser notification
    this.showBrowserNotification(title, body);
    
    console.log('🔔 Order status notification:', { orderId, status, message });
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log('Notifications', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Enable/disable sound
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    console.log('Sound notifications', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Enable/disable vibration
   */
  setVibrationEnabled(enabled) {
    this.vibrationEnabled = enabled;
    console.log('Vibration notifications', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Get notification settings
   */
  getSettings() {
    return {
      isEnabled: this.isEnabled,
      soundEnabled: this.soundEnabled,
      vibrationEnabled: this.vibrationEnabled,
      vibrationSupported: this.vibrationSupported,
      notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported'
    };
  }

  /**
   * Test notification (for settings/preferences)
   */
  testNotification() {
    this.generateNotificationSound('default');
    this.vibrate([200, 100, 200]);
    this.showBrowserNotification('Test Notification', 'This is a test notification');
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
