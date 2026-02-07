import MenuItem from './MenuItem'
import { useMemo, useState, useEffect } from 'react'
import { menuService } from '../services/menuService'
import { CATEGORY_DISPLAY_ORDER } from '../constants/categories'


const Menu = ({ addToCart, cart, updateQuantity, searchQuery = '' }) => {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch menu items from Supabase
  const fetchMenuItems = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const result = await menuService.getAvailableMenuItems()

      if (result.success) {
        setMenuItems(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch menu items')
        setMenuItems([])
      }
    } catch (err) {
      console.error('Menu: Error fetching menu items:', err)
      setError('Failed to fetch menu items: ' + err.message)
      setMenuItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchMenuItems(true)
  }

  useEffect(() => {
    fetchMenuItems()
  }, [])


  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems

    return menuItems
      .filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Prioritize exact name matches
        const aNameMatch = a.name.toLowerCase().startsWith(searchQuery.toLowerCase())
        const bNameMatch = b.name.toLowerCase().startsWith(searchQuery.toLowerCase())
        
        if (aNameMatch && !bNameMatch) return -1
        if (!aNameMatch && bNameMatch) return 1
        
        // Then prioritize name matches over description matches
        const aNameContains = a.name.toLowerCase().includes(searchQuery.toLowerCase())
        const bNameContains = b.name.toLowerCase().includes(searchQuery.toLowerCase())
        
        if (aNameContains && !bNameContains) return -1
        if (!aNameContains && bNameContains) return 1
        
        return 0
      })
  }, [menuItems, searchQuery])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {}
    
    filteredItems.forEach(item => {
      const category = item.category || 'Other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
    })
    
    return groups
  }, [filteredItems])

  // Category order for consistent display
  const categoryOrder = CATEGORY_DISPLAY_ORDER

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Failed to load menu</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="space-y-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Refreshing...' : 'Try Again'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors mr-3"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // No items found
  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">No items found</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {searchQuery ? 'Try searching with different keywords or browse through our categories' : 'No menu items available at the moment'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-16">


      {Object.keys(groupedItems).length > 0 ? (
        categoryOrder
          .filter(category => groupedItems[category])
          .map((category, index) => (
            <div key={category} className="category-group">
              {/* Category Header with enhanced styling */}
              <div className="relative mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-700 tracking-wide uppercase">{category}</h2>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
                    {groupedItems[category].length} item{groupedItems[category].length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {/* Items Grid with proximity-based spacing */}
              <div className="grid gap-4">
                {groupedItems[category].map((item, itemIndex) => (
                  <div key={item.id}>
                    <MenuItem
                      item={item}
                      addToCart={addToCart}
                      cartItem={cart[item.id]}
                      updateQuantity={updateQuantity}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">Try searching with different keywords or browse through our categories</p>
        </div>
      )}
    </div>
  )
}

export default Menu 