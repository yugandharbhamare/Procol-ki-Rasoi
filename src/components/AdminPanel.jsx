import { useState, useEffect } from 'react'
import { getPendingOrders, markOrderAsSynced, clearPendingOrders, fetchOrdersFromGoogleSheets } from '../services/googleSheetsService'
import { useOrders } from '../contexts/OrderContext'

const AdminPanel = () => {
  const { syncFromGoogleSheets } = useOrders()
  const [pendingOrders, setPendingOrders] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  useEffect(() => {
    loadPendingOrders()
  }, [])

  const loadPendingOrders = () => {
    const orders = getPendingOrders()
    setPendingOrders(orders)
  }

  const handleMarkAsSynced = (orderId) => {
    markOrderAsSynced(orderId)
    loadPendingOrders()
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all pending orders?')) {
      clearPendingOrders()
      loadPendingOrders()
    }
  }

  const handleSyncFromGoogleSheets = async () => {
    setIsSyncing(true)
    setSyncMessage('')
    
    try {
      const result = await syncFromGoogleSheets()
      if (result.success) {
        setSyncMessage(`✅ ${result.message} - ${result.newOrders} new orders found`)
      } else {
        setSyncMessage(`❌ Failed to sync: ${result.error}`)
      }
    } catch (error) {
      setSyncMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsSyncing(false)
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(''), 5000)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (!showPanel) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowPanel(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
          title="Admin Panel"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Google Sheets Sync Panel</h2>
          <button
            onClick={() => setShowPanel(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Sync from Google Sheets Section */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Pull from Google Sheets</h3>
                  <p className="text-sm text-blue-700">Import orders from the Google Sheet to your order history</p>
                </div>
                <button
                  onClick={handleSyncFromGoogleSheets}
                  disabled={isSyncing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {isSyncing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Pull Orders</span>
                    </>
                  )}
                </button>
              </div>
              {syncMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  syncMessage.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {syncMessage}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Orders ({pendingOrders.length})
              </h3>
              <div className="space-x-2">
                <button
                  onClick={loadPendingOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Refresh
                </button>
                {pendingOrders.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No pending orders to sync</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((pendingOrder) => (
                  <div key={pendingOrder.orderId} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Order {pendingOrder.orderId}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(pendingOrder.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Formatted Data for Google Sheets:</h5>
                        <div className="bg-white p-3 rounded border text-sm">
                          <div className="space-y-1">
                            {pendingOrder.data.map((value, index) => (
                              <div key={index} className="flex">
                                <span className="font-medium w-24 text-gray-600">
                                  {['Order ID', 'Date', 'Time', 'Customer', 'Email', 'Items', 'Amount', 'Status', 'Timestamp'][index]}:
                                </span>
                                <span className="text-gray-900">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">CSV Format:</h5>
                        <div className="bg-white p-3 rounded border">
                          <code className="text-sm text-gray-800 break-all">
                            {pendingOrder.data.map(value => `"${value}"`).join(',')}
                          </code>
                          <button
                            onClick={() => copyToClipboard(pendingOrder.data.map(value => `"${value}"`).join(','))}
                            className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Copy CSV
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleMarkAsSynced(pendingOrder.orderId)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                      >
                        Mark as Synced
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Copy the CSV data for each order</li>
              <li>2. Open the Google Sheet: <a href="https://docs.google.com/spreadsheets/d/1EC1_jaIll58v01Y_psLx2nLJLAb_yCl894aKeOsUurA/edit?gid=1606132285#gid=1606132285" target="_blank" rel="noopener noreferrer" className="underline">Orders via webapp</a></li>
              <li>3. Paste the data in the next available row</li>
              <li>4. Click "Mark as Synced" to remove from pending list</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel 