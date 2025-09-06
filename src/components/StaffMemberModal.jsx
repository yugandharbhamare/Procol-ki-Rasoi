import { useState, useEffect } from 'react';
import { checkEmailExists } from '../services/staffManagementService';

const StaffMemberModal = ({ member, onSave, onClose, isAdmin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    photo_url: '',
    firebase_uid: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form data when member prop changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.emailid || '',
        photo_url: member.photo_url || '',
        firebase_uid: member.firebase_uid || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        photo_url: '',
        firebase_uid: ''
      });
    }
    setErrors({});
  }, [member]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check if email already exists (for new members or when email is changed)
    if (!member || member.emailid !== formData.email) {
      try {
        const emailExists = await checkEmailExists(formData.email, member?.id);
        if (emailExists) {
          setErrors({ email: 'This email is already registered' });
          return;
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setErrors({ email: 'Error checking email availability' });
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving staff member:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {member ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
                disabled={saving}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
                disabled={saving}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Photo URL */}
            <div>
              <label htmlFor="photo_url" className="block text-sm font-medium text-gray-700 mb-1">
                Photo URL
              </label>
              <input
                type="url"
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) => handleInputChange('photo_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter photo URL (optional)"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: URL to staff member's profile photo
              </p>
            </div>

            {/* Firebase UID */}
            <div>
              <label htmlFor="firebase_uid" className="block text-sm font-medium text-gray-700 mb-1">
                Firebase UID
              </label>
              <input
                type="text"
                id="firebase_uid"
                value={formData.firebase_uid}
                onChange={(e) => handleInputChange('firebase_uid', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter Firebase UID (optional)"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Firebase authentication UID for login access
              </p>
            </div>

            {/* Admin Notice */}
            {isAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Admin Access:</strong> You have full permissions to manage staff members.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Saving...' : (member ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffMemberModal;
