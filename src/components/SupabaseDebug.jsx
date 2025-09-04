import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseService'

const SupabaseDebug = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing')
  const [testResults, setTestResults] = useState({})
  const [errorDetails, setErrorDetails] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    console.log('🔧 SupabaseDebug: Starting connection test...')
    
    const results = {
      environmentVariables: false,
      clientInitialization: false,
      databaseConnection: false,
      tableAccess: false,
      userCreation: false
    }

    // Test 1: Environment Variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('🔧 SupabaseDebug: Environment variables check:')
    console.log('🔧 SupabaseDebug: VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('🔧 SupabaseDebug: VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
    
    if (supabaseUrl && supabaseAnonKey) {
      results.environmentVariables = true
      console.log('🔧 SupabaseDebug: Environment variables are set')
    } else {
      console.error('🔧 SupabaseDebug: Missing Supabase environment variables!')
      setErrorDetails('Missing Supabase environment variables. Please check your .env file.')
      setConnectionStatus('failed')
      setTestResults(results)
      return
    }

    // Test 2: Client Initialization
    try {
      if (supabase && typeof supabase === 'object') {
        results.clientInitialization = true
        console.log('🔧 SupabaseDebug: Supabase client initialized successfully')
      } else {
        throw new Error('Supabase client is not properly initialized')
      }
    } catch (error) {
      console.error('🔧 SupabaseDebug: Client initialization failed:', error)
      setErrorDetails(`Client initialization failed: ${error.message}`)
      setConnectionStatus('failed')
      setTestResults(results)
      return
    }

    // Test 3: Database Connection
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('count')
        .limit(1)
      
      if (error) {
        throw error
      }
      
      results.databaseConnection = true
      console.log('🔧 SupabaseDebug: Database connection successful')
    } catch (error) {
      console.error('🔧 SupabaseDebug: Database connection failed:', error)
      setErrorDetails(`Database connection failed: ${error.message}`)
      setConnectionStatus('failed')
      setTestResults(results)
      return
    }

    // Test 4: Table Access
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .limit(5)
      
      if (error) {
        throw error
      }
      
      results.tableAccess = true
      console.log('🔧 SupabaseDebug: Table access successful, found', data?.length || 0, 'menu items')
    } catch (error) {
      console.error('🔧 SupabaseDebug: Table access failed:', error)
      setErrorDetails(`Table access failed: ${error.message}`)
      setConnectionStatus('failed')
      setTestResults(results)
      return
    }

    // Test 5: User Creation (simulated)
    try {
      // Just test if we can access the users table
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (error) {
        throw error
      }
      
      results.userCreation = true
      console.log('🔧 SupabaseDebug: User table access successful')
    } catch (error) {
      console.error('🔧 SupabaseDebug: User table access failed:', error)
      setErrorDetails(`User table access failed: ${error.message}`)
      setConnectionStatus('failed')
      setTestResults(results)
      return
    }

    console.log('🔧 SupabaseDebug: All tests passed!')
    setConnectionStatus('success')
    setTestResults(results)
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'failed': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success': return '✅'
      case 'failed': return '❌'
      default: return '⏳'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success': return 'Connected'
      case 'failed': return 'Connection Failed'
      default: return 'Testing...'
    }
  }

  if (connectionStatus === 'success') {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✅</span>
            <span className="font-medium text-green-800">Supabase Connection Successful</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Environment Variables</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Client Initialization</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Database Connection</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Table Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>User Table Access</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">❌</span>
          <span className="font-medium text-red-800">Supabase Connection Failed</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {errorDetails && (
        <div className="mt-2 text-red-700 text-sm">
          <strong>Error:</strong> {errorDetails}
        </div>
      )}
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <div className="space-y-3">
            <div className="text-sm">
              <strong>Environment Variables:</strong>
              <div className="ml-4 mt-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span>VITE_SUPABASE_URL:</span>
                  <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                    {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>VITE_SUPABASE_ANON_KEY:</span>
                  <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                    {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-sm">
              <strong>Test Results:</strong>
              <div className="ml-4 mt-1 space-y-1">
                {Object.entries(testResults).map(([test, passed]) => (
                  <div key={test} className="flex items-center space-x-2">
                    <span className="capitalize">{test.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className={passed ? 'text-green-600' : 'text-red-600'}>
                      {passed ? '✅ Passed' : '❌ Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-sm">
              <strong>How to Fix:</strong>
              <div className="ml-4 mt-1 space-y-1 text-red-700">
                <div>1. Create a <code className="bg-red-100 px-1 rounded">.env</code> file in your project root</div>
                <div>2. Add your Supabase credentials:</div>
                <div className="ml-4 font-mono text-xs bg-red-100 p-2 rounded">
                  VITE_SUPABASE_URL=https://your-project-id.supabase.co<br/>
                  VITE_SUPABASE_ANON_KEY=your-anon-key-here
                </div>
                <div>3. Restart your development server</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupabaseDebug
