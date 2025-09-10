import SearchBar from './SearchBar'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationSettings from './NotificationSettings'
import { 
  ClockIcon, 
  BellIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const Header = ({ user, cartItemCount, onSearch }) => {
  const { signOutUser } = useAuth()
  const [imageError, setImageError] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const navigate = useNavigate()

  // Debug: Log user data to see what we're getting
  console.log('Header: User data:', user)
  console.log('Header: User photoURL:', user?.photoURL)
  console.log('Header: User displayName:', user?.displayName)
  console.log('Header: User email:', user?.email)
  console.log('Header: Cart item count:', cartItemCount)
  console.log('Header: onSearch function:', onSearch)

  const handleSignOut = async () => {
    try {
      await signOutUser()
      setDrawerOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleImageError = () => {
    console.log('Profile image failed to load, showing fallback')
    setImageError(true)
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleSearch = (query) => {
    console.log('Header: Search query received:', query)
    setSearchQuery(query)
    if (onSearch && typeof onSearch === 'function') {
      console.log('Header: Calling onSearch function with query:', query)
      onSearch(query)
    } else {
      console.warn('Header: onSearch function is not available')
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/Staff portal logo.png" 
                alt="Procol ki Rasoi Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Procol ki Rasoi</h1>
              <p className="text-sm text-gray-600">Your office kitchen</p>
            </div>
          </div>
          
          {/* User Profile Picture */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* Desktop: Show name and email */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              {/* Avatar - Clickable on mobile, hover on desktop */}
              <div className="relative group">
                <button
                  onClick={toggleDrawer}
                  className="focus:outline-none"
                >
                  {user.photoURL && !imageError ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-orange-300 transition-colors cursor-pointer object-cover"
                      onError={handleImageError}
                      onLoad={() => console.log('Profile image loaded successfully')}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center border-2 border-gray-200 hover:border-orange-300 transition-colors cursor-pointer">
                      <span className="text-white font-semibold text-lg">
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                </button>
                
                {/* Desktop: User Dropdown */}
                <div className="hidden md:block absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                  {/* My Orders Option */}
                  <button
                    onClick={() => {
                      navigate('/orders')
                    }}
                    className="w-full flex items-start space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors border-b border-gray-100"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ClockIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">My Orders</span>
                      <p className="text-xs text-gray-500">Track your current and past orders</p>
                    </div>
                  </button>
                  
                  {/* Notification Settings Option */}
                  <button
                    onClick={() => setShowNotificationSettings(true)}
                    className="w-full flex items-start space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BellIcon className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Notifications</span>
                      <p className="text-xs text-gray-500">Manage notification settings</p>
                    </div>
                  </button>
                  
                  {/* Sign Out Option */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-start space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Sign Out</span>
                      <p className="text-xs text-gray-500">Log out of your account</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <SearchBar 
          searchQuery={searchQuery}
          onSearch={handleSearch}
        />
      </div>
      
      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleDrawer}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={toggleDrawer}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* User Info */}
              {user && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {user.photoURL && !imageError ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center border-2 border-gray-200">
                        <span className="text-white font-semibold text-xl">
                          {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{user.displayName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation Options */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigate('/orders')
                    toggleDrawer()
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium">My Orders</span>
                </button>
                
                <button
                  onClick={() => setShowNotificationSettings(true)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BellIcon className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-medium">Notifications</span>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Settings Modal */}
      <NotificationSettings 
        isOpen={showNotificationSettings} 
        onClose={() => setShowNotificationSettings(false)} 
      />
    </header>
  )
}

export default Header 