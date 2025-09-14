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

        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
