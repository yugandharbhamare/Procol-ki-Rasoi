// Google Sheets API service for storing order data
// Note: This is a client-side implementation that would need to be adapted for production
// In a real production app, you'd want to use a backend service to handle Google Sheets API calls

const SPREADSHEET_ID = '1EC1_jaIll58v01Y_psLx2nLJLAb_yCl894aKeOsUurA'
const SHEET_NAME = 'Orders via webapp'

// Function to format order data for Google Sheets
const formatOrderForSheets = (order) => {
  const orderDate = new Date(order.timestamp)
  const formattedDate = orderDate.toLocaleDateString('en-IN')
  const formattedTime = orderDate.toLocaleTimeString('en-IN')
  
  // Format items as a string
  const itemsString = Object.entries(order.items)
    .map(([itemId, item]) => `${item.name} (${item.quantity})`)
    .join(', ')
  
  return [
    order.id,                    // Order ID
    formattedDate,              // Date
    formattedTime,              // Time
    order.user.displayName || `${order.user.firstName} ${order.user.lastName}`, // Customer Name
    order.user.email,           // Customer Email
    itemsString,                // Items Ordered
    order.total,                // Total Amount
    'Completed',                // Status
    order.timestamp             // Full timestamp for reference
  ]
}

// Function to add order to Google Sheets
export const addOrderToGoogleSheets = async (order) => {
  try {
    // For now, we'll log the formatted data
    // In a real implementation, you'd make an API call to your backend
    // which would then use the Google Sheets API
    const formattedData = formatOrderForSheets(order)
    
    console.log('Order data formatted for Google Sheets:', formattedData)
    
    // Store the data locally for now (this would be replaced with actual API call)
    const ordersToSync = JSON.parse(localStorage.getItem('ordersToSync') || '[]')
    ordersToSync.push({
      orderId: order.id,
      data: formattedData,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('ordersToSync', JSON.stringify(ordersToSync))
    
    return {
      success: true,
      message: 'Order data prepared for Google Sheets sync',
      orderId: order.id
    }
  } catch (error) {
    console.error('Error preparing order for Google Sheets:', error)
    return {
      success: false,
      message: 'Failed to prepare order for Google Sheets',
      error: error.message
    }
  }
}

// Function to get pending orders for sync
export const getPendingOrders = () => {
  try {
    return JSON.parse(localStorage.getItem('ordersToSync') || '[]')
  } catch (error) {
    console.error('Error getting pending orders:', error)
    return []
  }
}

// Function to mark order as synced
export const markOrderAsSynced = (orderId) => {
  try {
    const ordersToSync = JSON.parse(localStorage.getItem('ordersToSync') || '[]')
    const updatedOrders = ordersToSync.filter(order => order.orderId !== orderId)
    localStorage.setItem('ordersToSync', JSON.stringify(updatedOrders))
  } catch (error) {
    console.error('Error marking order as synced:', error)
  }
}

// Function to clear all pending orders (for testing)
export const clearPendingOrders = () => {
  localStorage.removeItem('ordersToSync')
}

// Function to fetch orders from Google Sheets
export const fetchOrdersFromGoogleSheets = async () => {
  try {
    // For now, we'll simulate fetching from Google Sheets
    // In a real implementation, you'd make an API call to your backend
    // which would then use the Google Sheets API to read data
    
    // Check if we have any locally stored orders from sheets
    const storedSheetOrders = localStorage.getItem('googleSheetsOrders')
    if (storedSheetOrders) {
      return JSON.parse(storedSheetOrders)
    }
    
    // For demo purposes, we'll create some sample data
    // In production, this would be replaced with actual API call
    const sampleOrders = [
      {
        id: 'ORD1703123456789',
        date: '20/12/2023',
        time: '14:30:25',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: 'Masala Chai (2), Plain Maggi (1)',
        total: 40,
        status: 'Completed',
        timestamp: '2023-12-20T14:30:25.000Z'
      },
      {
        id: 'ORD1703123456790',
        date: '20/12/2023',
        time: '15:45:12',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        items: 'Veg Butter Maggi (1), Amul Chaas (1)',
        total: 45,
        status: 'Completed',
        timestamp: '2023-12-20T15:45:12.000Z'
      }
    ]
    
    // Store the sample data locally for demo
    localStorage.setItem('googleSheetsOrders', JSON.stringify(sampleOrders))
    
    return {
      success: true,
      orders: sampleOrders,
      message: 'Orders fetched from Google Sheets (demo data)'
    }
  } catch (error) {
    console.error('Error fetching orders from Google Sheets:', error)
    return {
      success: false,
      orders: [],
      error: error.message
    }
  }
}

// Function to sync orders from Google Sheets to local storage
export const syncOrdersFromGoogleSheets = async () => {
  try {
    const result = await fetchOrdersFromGoogleSheets()
    if (result.success) {
      // Convert Google Sheets format to app format
      const convertedOrders = result.orders.map(sheetOrder => ({
        id: sheetOrder.id,
        timestamp: sheetOrder.timestamp,
        total: sheetOrder.total,
        user: {
          displayName: sheetOrder.customerName,
          email: sheetOrder.customerEmail
        },
        items: parseItemsFromString(sheetOrder.items),
        source: 'google_sheets'
      }))
      
      // Store converted orders
      localStorage.setItem('googleSheetsOrdersConverted', JSON.stringify(convertedOrders))
      
      return {
        success: true,
        orders: convertedOrders,
        message: 'Orders synced from Google Sheets'
      }
    }
    return result
  } catch (error) {
    console.error('Error syncing orders from Google Sheets:', error)
    return {
      success: false,
      orders: [],
      error: error.message
    }
  }
}

// Helper function to parse items string back to object format
const parseItemsFromString = (itemsString) => {
  const items = {}
  const itemPairs = itemsString.split(', ')
  
  itemPairs.forEach(pair => {
    const match = pair.match(/(.+) \((\d+)\)/)
    if (match) {
      const itemName = match[1].trim()
      const quantity = parseInt(match[2])
      
      // Find the item ID from the menu items
      const menuItems = getMenuItems()
      const menuItem = menuItems.find(item => item.name === itemName)
      
      if (menuItem) {
        items[menuItem.id] = {
          name: itemName,
          price: menuItem.price,
          image: menuItem.image,
          quantity: quantity
        }
      } else {
        // Fallback if item not found in menu
        const tempId = `temp_${Date.now()}_${Math.random()}`
        items[tempId] = {
          name: itemName,
          price: 0, // Unknown price
          image: '🍽️',
          quantity: quantity
        }
      }
    }
  })
  
  return items
}

// Helper function to get menu items (you might want to import this from Menu.jsx)
const getMenuItems = () => {
  // This is a simplified version - in production, you'd import the actual menu items
  return [
    { id: 1, name: "Ginger Chai", price: 10, image: "/optimized/Ginger Tea.png" },
    { id: 2, name: "Masala Chai", price: 10, image: "/optimized/Ginger Tea.png" },
    { id: 4, name: "Plain Maggi", price: 20, image: "/optimized/Plain Maggi.png" },
    { id: 5, name: "Veg Butter Maggi", price: 30, image: "/optimized/Veg butter maggi.png" },
    { id: 35, name: "Amul Chaas", price: 15, image: "/optimized/Amul Chaas.png" },
    // Add more items as needed
  ]
} 