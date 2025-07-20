# Google Sheets Integration Setup

This document explains how the Google Sheets integration works and how to set it up for production use.

## Current Implementation

The app currently includes a client-side Google Sheets integration that:

1. **Formats Order Data**: When an order is completed, the data is formatted for Google Sheets
2. **Stores Locally**: Order data is stored locally in `localStorage` as "pending orders"
3. **Admin Panel**: Provides an admin interface to view and manage pending orders
4. **Manual Sync**: Allows manual copying of CSV data to Google Sheets
5. **Pull from Sheets**: Import orders from Google Sheets to local order history

## How It Works

### Order Flow
1. User places an order and completes payment
2. Order data is automatically formatted for Google Sheets
3. Data is stored locally as a "pending order"
4. Admin can view pending orders in the admin panel
5. Admin copies CSV data and pastes it into Google Sheets
6. Admin marks order as "synced" to remove from pending list

### Pull from Google Sheets Flow
1. Admin clicks "Pull Orders" in admin panel or "Sync from Sheets" in order history
2. System fetches orders from Google Sheets (currently using demo data)
3. Orders are converted from Google Sheets format to app format
4. New orders are merged with existing local orders
5. Duplicate orders are automatically filtered out
6. Order history is updated with all orders

### Data Format
Each order is formatted with the following columns:
- Order ID
- Date
- Time
- Customer Name
- Customer Email
- Items Ordered
- Total Amount
- Status
- Full Timestamp

## Admin Panel

The admin panel is accessible via a floating button (gear icon) in the bottom-right corner of the app.

### Features:
- View all pending orders
- See formatted data for each order
- Copy CSV data to clipboard
- Mark orders as synced
- Clear all pending orders
- Direct link to Google Sheet
- Pull orders from Google Sheets
- Import orders to local history

## Google Sheet Details

- **Spreadsheet ID**: `1EC1_jaIll58v01Y_psLx2nLJLAb_yCl894aKeOsUurA`
- **Sheet Name**: `Orders via webapp`
- **URL**: https://docs.google.com/spreadsheets/d/1EC1_jaIll58v01Y_psLx2nLJLAb_yCl894aKeOsUurA/edit?gid=1606132285#gid=1606132285

## Production Setup

For a production environment, you'll want to implement a proper backend service. Here's what you need to do:

### 1. Backend Service
Create a Node.js/Express backend with:

```javascript
// Example backend endpoint
app.post('/api/orders/sync', async (req, res) => {
  const { orderData } = req.body
  
  try {
    // Use Google Sheets API to append data
    const sheets = google.sheets({ version: 'v4', auth })
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: '1EC1_jaIll58v01Y_psLx2nLJLAb_yCl894aKeOsUurA',
      range: 'Orders via webapp!A:I',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [orderData]
      }
    })
    
    res.json({ success: true, message: 'Order synced to Google Sheets' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
```

### 2. Google Sheets API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create service account credentials
5. Download JSON key file
6. Share your Google Sheet with the service account email

### 3. Environment Variables
Add to your backend `.env`:
```
GOOGLE_SHEETS_CREDENTIALS_PATH=path/to/service-account-key.json
GOOGLE_SHEETS_SPREADSHEET_ID=1EC1_jaIll58v01Y_psLx2nLJLAb_yCl894aKeOsUurA
```

### 4. Update Frontend
Replace the local storage approach with API calls:

```javascript
// In googleSheetsService.js
export const addOrderToGoogleSheets = async (order) => {
  try {
    const response = await fetch('/api/orders/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderData: formatOrderForSheets(order)
      })
    })
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error)
    return { success: false, error: error.message }
  }
}
```

## Security Considerations

1. **API Keys**: Never expose Google API keys in frontend code
2. **Authentication**: Implement proper authentication for admin access
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Data Validation**: Validate order data before syncing
5. **Error Handling**: Implement proper error handling and retry logic

## Testing

To test the current implementation:

### Testing Push to Google Sheets:
1. Place a test order in the app
2. Complete the payment process
3. Open the admin panel (gear icon)
4. Verify the order appears in pending orders
5. Copy the CSV data and paste into Google Sheets
6. Mark the order as synced

### Testing Pull from Google Sheets:
1. Open the admin panel (gear icon)
2. Click "Pull Orders" button
3. Check the sync message for success/failure
4. Go to Order History page to see imported orders
5. Alternatively, use "Sync from Sheets" button in Order History page

## Troubleshooting

### Common Issues:
- **Orders not appearing**: Check browser console for errors
- **CSV format issues**: Ensure proper escaping of special characters
- **Google Sheets access**: Verify sheet permissions and sharing settings

### Debug Commands:
```javascript
// Check pending orders in browser console
console.log(JSON.parse(localStorage.getItem('ordersToSync') || '[]'))

// Clear all pending orders
localStorage.removeItem('ordersToSync')
```

## Future Enhancements

1. **Automatic Sync**: Implement real-time automatic syncing
2. **Webhook Integration**: Add webhooks for real-time updates
3. **Bulk Operations**: Support for bulk order syncing
4. **Sync Status**: Track sync status and retry failed syncs
5. **Data Validation**: Add server-side data validation
6. **Audit Log**: Track all sync operations and errors 