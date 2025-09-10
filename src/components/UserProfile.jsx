import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const UserProfile = () => {
  const { user, signOutUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-primary-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 