import SearchBar from './SearchBar'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Header = ({ searchQuery, onSearchChange }) => {
  const { user, signOutUser } = useAuth()
  const [imageError, setImageError] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  // Debug: Log user data to see what we're getting
  console.log('User data in Header:', user)

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
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🍽️</span>
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
                      className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-primary-300 transition-colors cursor-pointer object-cover"
                      onError={handleImageError}
                      onLoad={() => console.log('Profile image loaded successfully')}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center border-2 border-gray-200 hover:border-primary-300 transition-colors cursor-pointer">
                      <span className="text-white font-semibold text-lg">
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                </button>
                
                {/* Desktop: User Dropdown */}
                <div className="hidden md:block absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                  {/* Order History Option */}
                  <button
                    onClick={() => {
                      navigate('/order-history')
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors border-b border-gray-100"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Order History</span>
                      <p className="text-xs text-gray-500">View your past orders</p>
                    </div>
                  </button>
                  
                  {/* Sign Out Option */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>

      {/* Mobile User Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              {/* Drawer Header with User Info */}
              <div className="px-4 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  {user.photoURL && !imageError ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-16 h-16 rounded-full border-2 border-gray-200 object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center border-2 border-gray-200">
                      <span className="text-white font-semibold text-2xl">
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.displayName || 'User'
                      }
                    </h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 px-4 py-3">
                <div className="space-y-3">
                  {/* Order History Option */}
                  <button
                    onClick={() => {
                      navigate('/order-history')
                      setDrawerOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Order History</span>
                      <p className="text-sm text-gray-500 mt-1">View your past orders</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}

export default Header 