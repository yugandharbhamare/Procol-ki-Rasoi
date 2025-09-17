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
    console.log('Adding order to Google Sheets:', order)
    
    // For now, we'll log the formatted data
    // In a real implementation, you'd make an API call to your backend
    // which would then use the Google Sheets API
    const formattedData = formatOrderForSheets(order)
    
    console.log('Order data formatted for Google Sheets:', formattedData)
    
    // No longer storing orders in localStorage - this was causing duplicate orders
    // Google Sheets integration should be handled directly without local storage
    console.log('Order data formatted for Google Sheets (not stored locally):', formattedData)
    
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

// Helper function to get menu items (fallback when database is not available)
const getMenuItems = () => {
  // This is a fallback version - in production, this should fetch from the database
  // Using centralized image mappings from menuItemImageService
  const { getMenuItemImage } = require('./menuItemImageService');
  
  const menuItems = [
    // Hot Beverages
    { id: 1, name: "Ginger Chai", price: 10 },
    { id: 2, name: "Masala Chai", price: 10 },
    
    // Cold Beverages
    { id: 35, name: "Amul Chaas", price: 15 },
    { id: 36, name: "Amul Lassi", price: 20 },
    { id: 37, name: "Coca Cola", price: 40 },
    
    // Breakfast Items
    { id: 3, name: "Masala Oats", price: 20 },
    { id: 10, name: "MTR Poha", price: 30 },
    { id: 11, name: "MTR Upma", price: 30 },
    { id: 15, name: "Besan Chila", price: 30 },
    
    // Maggi Varieties
    { id: 4, name: "Plain Maggi", price: 20 },
    { id: 5, name: "Veg Butter Maggi", price: 30 },
    { id: 6, name: "Cheese Maggi", price: 30 },
    { id: 7, name: "Butter Atta Maggi", price: 30 },
    { id: 8, name: "Veg Cheese Maggi", price: 40 },
    { id: 9, name: "Cheese Atta Maggi", price: 45 },
    
    // Sandwiches
    { id: 12, name: "Veg Cheese Sandwich", price: 40 },
    { id: 13, name: "Aloo Sandwich", price: 30 },
    { id: 14, name: "Aloo Cheese Sandwich", price: 45 },
    
    // Main Course
    { id: 22, name: "Pasta", price: 40 },
    
    // Street Food
    { id: 16, name: "Bhel Puri", price: 30 },
    { id: 30, name: "Fatafat Bhel", price: 10 },
    
    // Snacks & Namkeen
    { id: 27, name: "Aloo Bhujiya", price: 10 },
    { id: 31, name: "Lite Mixture", price: 10 },
    { id: 32, name: "Moong Dal", price: 10 },
    { id: 33, name: "Hing Chana", price: 10 },
    { id: 28, name: "Salted Peanut", price: 10 },
    { id: 29, name: "Popcorn", price: 10 },
    
    // Biscuits & Cookies
    { id: 24, name: "Bourbon Biscuit", price: 10 },
    { id: 25, name: "Good Day Biscuit", price: 10 },
    { id: 26, name: "Parle G Biscuit", price: 10 },
    
    // Fresh Items
    { id: 17, name: "Onion", price: 10 },
    { id: 18, name: "Cucumber", price: 10 },
    { id: 19, name: "Mix Salad", price: 20 },
    { id: 23, name: "Cheese", price: 15 },
    
    // Add-ons & Extras
    { id: 20, name: "Gud", price: 5 },
    { id: 21, name: "Saunf", price: 5 },
    { id: 34, name: "Pass Pass", price: 2 }
  ];
  
  // Add image paths using centralized service
  return menuItems.map(item => ({
    ...item,
    image: getMenuItemImage(item.name)
  }));
} 