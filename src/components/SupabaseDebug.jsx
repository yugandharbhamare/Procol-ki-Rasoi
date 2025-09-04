import { useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import { menuService } from '../services/menuService'

export default function SupabaseDebug() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [menuItemsCount, setMenuItemsCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('Testing connection...')
      setError(null)

      // Test 1: Basic connection
      console.log('🔧 Testing Supabase connection...')
      const { data, error: connectionError } = await supabase
        .from('menu_items')
        .select('count', { count: 'exact', head: true })

      if (connectionError) {
        throw new Error(`Connection failed: ${connectionError.message}`)
      }

      setConnectionStatus('✅ Connected to Supabase')

      // Test 2: Menu items count
      console.log('🔧 Testing menu items fetch...')
      const menuResult = await menuService.getAvailableMenuItems()
      
      if (menuResult.success) {
        setMenuItemsCount(menuResult.data?.length || 0)
        console.log('✅ Menu items loaded:', menuResult.data?.length || 0)
      } else {
        throw new Error(`Menu fetch failed: ${menuResult.error}`)
      }

    } catch (err) {
      console.error('❌ Supabase test failed:', err)
      setError(err.message)
      setConnectionStatus('❌ Connection failed')
    }
  }

  const testMenuItems = async () => {
    try {
      console.log('🔧 Testing menu items directly...')
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(5)

      if (error) {
        console.error('❌ Direct menu fetch failed:', error)
      } else {
        console.log('✅ Direct menu fetch successful:', data?.length || 0, 'items')
        console.log('Sample items:', data)
      }
    } catch (err) {
      console.error('❌ Direct menu test failed:', err)
    }
  }

  const testUsers = async () => {
    try {
      console.log('🔧 Testing users table...')
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })

      if (error) {
        console.error('❌ Users table test failed:', error)
      } else {
        console.log('✅ Users table accessible, count:', data?.[0]?.count || 'unknown')
      }
    } catch (err) {
      console.error('❌ Users test failed:', err)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">🔧 Supabase Connection Debug</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Connection Status</h3>
          <p className={connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
            {connectionStatus}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Menu Items</h3>
          <p>Available items: {menuItemsCount}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={testSupabaseConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Test Connection
          </button>
          <button
            onClick={testMenuItems}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Test Menu Items
          </button>
          <button
            onClick={testUsers}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Test Users
          </button>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Environment Variables</h3>
          <p className="text-sm text-blue-700">
            VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}<br />
            VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
          </p>
        </div>
      </div>
    </div>
  )
}
