import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import { XMarkIcon } from '@heroicons/react/24/outline';

const NotificationSettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    isEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true
  });

  useEffect(() => {
    if (isOpen) {
      // Load current settings
      const currentSettings = notificationService.getSettings();
      setSettings({
        isEnabled: currentSettings.isEnabled,
        soundEnabled: currentSettings.soundEnabled,
        vibrationEnabled: currentSettings.vibrationEnabled
      });
    }
  }, [isOpen]);

  const handleToggle = (setting) => {
    const newValue = !settings[setting];
    setSettings(prev => ({ ...prev, [setting]: newValue }));
    
    // Apply setting immediately
    switch (setting) {
      case 'isEnabled':
        notificationService.setEnabled(newValue);
        break;
      case 'soundEnabled':
        notificationService.setSoundEnabled(newValue);
        break;
      case 'vibrationEnabled':
        notificationService.setVibrationEnabled(newValue);
        break;
    }
  };

  const handleTestNotification = () => {
    notificationService.testNotification();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Settings */}
        <div className="p-6 space-y-6">
          {/* Enable Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Enable Notifications</h3>
              <p className="text-sm text-gray-500">Receive notifications for order updates</p>
            </div>
            <button
              onClick={() => handleToggle('isEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.isEnabled ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sound Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Sound Notifications</h3>
              <p className="text-sm text-gray-500">Play sounds for notifications</p>
            </div>
            <button
              onClick={() => handleToggle('soundEnabled')}
              disabled={!settings.isEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled && settings.isEnabled ? 'bg-orange-600' : 'bg-gray-200'
              } ${!settings.isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled && settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Vibration</h3>
              <p className="text-sm text-gray-500">Vibrate on mobile devices</p>
            </div>
            <button
              onClick={() => handleToggle('vibrationEnabled')}
              disabled={!settings.isEnabled || !notificationService.vibrationSupported}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.vibrationEnabled && settings.isEnabled ? 'bg-orange-600' : 'bg-gray-200'
              } ${!settings.isEnabled || !notificationService.vibrationSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.vibrationEnabled && settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Device Support Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Device Support</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Sound: {notificationService.audioContext ? 'Supported' : 'Not supported'}
              </div>
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${notificationService.vibrationSupported ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Vibration: {notificationService.vibrationSupported ? 'Supported' : 'Not supported'}
              </div>
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${'Notification' in window ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Browser Notifications: {'Notification' in window ? 'Supported' : 'Not supported'}
              </div>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={handleTestNotification}
            disabled={!settings.isEnabled}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              settings.isEnabled
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Test Notification
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
