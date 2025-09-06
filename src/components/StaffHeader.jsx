import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StaffHeader({ staffUser, onSignOut, orderCounts, showNotifications }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);



  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/Staff portal logo.png" 
                alt="Staff Portal Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Procol ki Rasoi</h1>
              <p className="text-sm text-gray-500">Staff Portal</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              {orderCounts.pending > 0 && (
                <div className="flex items-center space-x-2 bg-orange-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-orange-700">
                    {orderCounts.pending} Pending
                  </span>
                </div>
              )}
              {orderCounts.accepted > 0 && (
                <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700">
                    {orderCounts.accepted} Preparing
                  </span>
                </div>
              )}
              {orderCounts.ready > 0 && (
                <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">
                    {orderCounts.ready} Ready
                  </span>
                </div>
              )}
            </div>


          </div>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none"
            >
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {staffUser?.displayName?.charAt(0) || staffUser?.email?.charAt(0) || 'S'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">
                  {staffUser?.displayName || 'Staff Member'}
                </p>
                <p className="text-xs text-gray-500">{staffUser?.email}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/staff/menu');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Manage Menu
                </button>
                <button
                  onClick={onSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
