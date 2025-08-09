# Staff Portal - Procol ki Rasoi

## Overview

The Staff Portal is a dedicated interface for restaurant staff, kitchen personnel, and managers to manage orders, confirm payments, and track order status in real-time.

## Features

### 🔐 **Authentication**
- Secure Google Sign-in for staff members
- Authorized email-based access control
- Separate authentication from customer portal

### 📊 **Real-time Order Management**
- Live order notifications
- Real-time order status updates
- Order count displays
- Auto-refresh functionality

### 🎯 **Order Status Tracking**
- **Pending**: New orders awaiting payment confirmation
- **Accepted**: Payment confirmed, order being prepared
- **Ready**: Order prepared, ready for pickup
- **Completed**: Order delivered/picked up

### 📱 **Mobile-First Design**
- Responsive interface for tablets and phones
- Touch-friendly buttons and interactions
- Optimized for kitchen and counter use

## Access URLs

### Staff Portal
- **Local Development**: `http://localhost:3000/staff`
- **Production**: `https://your-domain.com/staff`

### Customer Portal
- **Local Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Staff Authentication

### Authorized Email Addresses
Currently, the following email addresses are authorized to access the staff portal:

```javascript
const AUTHORIZED_STAFF_EMAILS = [
  'staff@procolki.com',
  'kitchen@procolki.com', 
  'manager@procolki.com'
];
```

### Adding New Staff Members
To add new staff members:

1. Open `src/contexts/StaffAuthContext.jsx`
2. Add the new email to the `AUTHORIZED_STAFF_EMAILS` array
3. Save and restart the development server

## Order Workflow

### 1. Order Placement (Customer)
- Customer places order through main interface
- Payment is processed via UPI
- Order is automatically created in Firestore with `pending` status

### 2. Payment Confirmation (Staff)
- Staff receives real-time notification of new order
- Staff reviews order details and payment confirmation
- Staff clicks "Accept Order" to confirm payment and start preparation

### 3. Order Preparation (Staff)
- Order status changes to `accepted`
- Kitchen staff can see order details and items
- Preparation begins

### 4. Order Ready (Staff)
- When preparation is complete, staff clicks "Mark as Ready"
- Order status changes to `ready`
- Customer is notified that order is ready for pickup

### 5. Order Completion (Staff)
- When customer picks up order, staff clicks "Complete Order"
- Order status changes to `completed`
- Order is archived

## Technical Implementation

### Firebase Integration
- **Firestore**: Real-time order database
- **Authentication**: Google Sign-in for staff
- **Real-time listeners**: Live order updates

### Key Components
- `StaffApp.jsx`: Main staff application
- `StaffDashboard.jsx`: Dashboard with order management
- `OrderCard.jsx`: Individual order display and actions
- `StaffHeader.jsx`: Navigation and status indicators
- `StaffLoginScreen.jsx`: Staff authentication

### State Management
- `StaffAuthContext.jsx`: Staff authentication state
- `StaffOrderContext.jsx`: Real-time order management

## Usage Instructions

### For Kitchen Staff

1. **Access the Portal**
   - Navigate to `http://localhost:3000/staff`
   - Sign in with authorized Google account

2. **View Pending Orders**
   - Check the "Pending" tab for new orders
   - Review order details, items, and customer information

3. **Accept Orders**
   - Click "Accept Order" to confirm payment and start preparation
   - Order moves to "In Preparation" status

4. **Mark Orders as Ready**
   - Complete preparation of order items
   - Click "Mark as Ready" when order is prepared
   - Order moves to "Ready" status

5. **Complete Orders**
   - When customer picks up order, click "Complete Order"
   - Order is marked as completed

### For Managers

1. **Monitor Order Volume**
   - View order counts in real-time
   - Check order status distribution

2. **Review Order History**
   - Access completed orders for analytics
   - Monitor preparation times

3. **Staff Management**
   - Add/remove authorized staff emails
   - Monitor staff activity

## Notifications

### Real-time Notifications
- **New Orders**: Orange notification banner appears
- **Order Status Changes**: Live updates without page refresh
- **Sound Alerts**: Optional audio notifications for new orders

### Notification Settings
- Notifications auto-hide after 5 seconds
- Manual dismiss option available
- Visual indicators for order counts

## Troubleshooting

### Common Issues

1. **Staff Can't Sign In**
   - Verify email is in `AUTHORIZED_STAFF_EMAILS`
   - Check Firebase configuration
   - Ensure Google Sign-in is enabled

2. **Orders Not Appearing**
   - Check Firestore connection
   - Verify order creation in customer portal
   - Check browser console for errors

3. **Real-time Updates Not Working**
   - Check Firebase Firestore rules
   - Verify internet connection
   - Restart development server

### Development Setup

1. **Firebase Configuration**
   ```bash
   # Ensure Firebase config is set up in .env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

2. **Firestore Rules**
   ```javascript
   // Example Firestore rules for orders collection
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /orders/{orderId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## Security Considerations

- Staff authentication is email-based
- Orders are stored securely in Firestore
- Real-time updates require authentication
- API keys are environment-specific

## Future Enhancements

- [ ] Push notifications for mobile devices
- [ ] Order analytics and reporting
- [ ] Staff performance tracking
- [ ] Inventory management integration
- [ ] Customer communication features
- [ ] Multi-location support
- [ ] Advanced order filtering
- [ ] Order priority management
- [ ] Kitchen display system (KDS)
- [ ] Integration with POS systems

## Support

For technical support or questions about the staff portal:

1. Check the troubleshooting section above
2. Review Firebase documentation
3. Contact the development team
4. Check GitHub issues for known problems

---

**Last Updated**: December 2024
**Version**: 1.0.0
