# 🔐 API Security Implementation

This document outlines the security measures implemented for the Procol ki Rasoi API to prevent unauthorized access to order data.

## 🛡️ Security Features

### 1. Authentication & Authorization
- **API Key Authentication**: Secure API keys for service-to-service communication
- **Bearer Token Authentication**: Staff and admin tokens for role-based access
- **Firebase ID Token Support**: Frontend authentication integration
- **Role-based Access Control**: Different permissions for staff, admin, and public endpoints

### 2. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Order Creation**: 10 requests per 5 minutes per IP
- **Order Updates**: 30 requests per minute per IP
- **Admin Operations**: 50 requests per 15 minutes per IP
- **Image Uploads**: 20 requests per 10 minutes per IP

### 3. Request Validation & Sanitization
- **Input Validation**: All request data is validated using express-validator
- **XSS Protection**: Request sanitization to prevent script injection
- **SQL Injection Prevention**: Parameterized queries and input escaping
- **Data Type Validation**: Strict type checking for all inputs

### 4. CORS & Headers Security
- **CORS Configuration**: Restricted to allowed origins only
- **Helmet.js**: Security headers for XSS, CSRF, and clickjacking protection
- **Content Security Policy**: Strict CSP rules
- **Request Size Limits**: 10MB limit on request bodies

## 🔑 Authentication Methods

### API Key Authentication
```bash
# Header method
curl -H "X-API-Key: your-api-key" https://api.example.com/secure/orders

# Query parameter method
curl "https://api.example.com/secure/orders?api_key=your-api-key"
```

### Bearer Token Authentication
```bash
# Staff token
curl -H "Authorization: Bearer staff-token" https://api.example.com/secure/orders

# Admin token
curl -H "Authorization: Bearer admin-token" https://api.example.com/secure/orders/:id
```

### Firebase ID Token (Frontend)
```bash
curl -H "Authorization: Firebase id-token" https://api.example.com/secure/orders
```

## 📋 Secure Endpoints

### Public Endpoints (No Authentication)
- `GET /health` - Health check
- `GET /` - API information

### Authenticated Endpoints (API Key Required)
- `POST /api/secure/orders/create` - Create new order

### Staff Endpoints (Staff Token Required)
- `GET /api/secure/orders` - Get all orders
- `GET /api/secure/orders/:id` - Get specific order
- `GET /api/secure/orders/status/:status` - Get orders by status
- `POST /api/secure/orders/:id/accept` - Accept order
- `POST /api/secure/orders/:id/ready` - Mark order as ready
- `POST /api/secure/orders/:id/complete` - Complete order
- `POST /api/secure/orders/:id/cancel` - Cancel order
- `PUT /api/secure/orders/:id/status` - Update order status

### Admin Endpoints (Admin Token Required)
- `DELETE /api/secure/orders/:id` - Delete order

## 🚀 Setup Instructions

### 1. Generate Security Keys
```bash
cd api
node scripts/setup-security.js
```

### 2. Configure Environment Variables
Copy the generated keys to your `.env` file:
```env
API_KEY_1=generated-api-key-1
API_KEY_2=generated-api-key-2
STAFF_TOKEN_1=generated-staff-token-1
STAFF_TOKEN_2=generated-staff-token-2
ADMIN_TOKEN=generated-admin-token
```

### 3. Install Dependencies
```bash
npm install express-rate-limit express-validator
```

### 4. Update Frontend
Update your frontend to include authentication headers:
```javascript
// API Key method
const response = await fetch('/api/secure/orders', {
  headers: {
    'X-API-Key': 'your-api-key'
  }
});

// Bearer token method
const response = await fetch('/api/secure/orders', {
  headers: {
    'Authorization': 'Bearer your-staff-token'
  }
});
```

## 🔒 Security Best Practices

### 1. Key Management
- **Rotate Keys Regularly**: Change API keys and tokens periodically
- **Secure Storage**: Store keys in environment variables, never in code
- **Access Control**: Limit key distribution to authorized personnel only
- **Monitoring**: Log all API key usage for security auditing

### 2. Network Security
- **HTTPS Only**: Use SSL/TLS in production
- **Firewall Rules**: Restrict API access to known IP ranges
- **VPN Access**: Use VPN for admin operations
- **Network Monitoring**: Monitor for suspicious traffic patterns

### 3. Application Security
- **Input Validation**: Validate all user inputs
- **Error Handling**: Don't expose sensitive information in error messages
- **Logging**: Log security events and failed authentication attempts
- **Updates**: Keep dependencies updated for security patches

### 4. Database Security
- **Connection Encryption**: Use encrypted database connections
- **Access Control**: Limit database user permissions
- **Backup Security**: Encrypt database backups
- **Audit Logs**: Enable database audit logging

## 🚨 Security Monitoring

### Logged Events
- Failed authentication attempts
- Rate limit violations
- Invalid request data
- Admin operations
- Unusual access patterns

### Alerts
- Multiple failed authentication attempts from same IP
- Rate limit violations
- Unauthorized access attempts
- Admin operations outside business hours

## 🔧 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check API key or token
   - Verify key is correctly formatted
   - Ensure key is not expired

2. **403 Forbidden**
   - Check user permissions
   - Verify token has required role
   - Confirm endpoint access rights

3. **429 Too Many Requests**
   - Wait for rate limit window to reset
   - Implement exponential backoff
   - Contact admin for limit increase

4. **400 Bad Request**
   - Check request validation errors
   - Verify required fields are present
   - Ensure data types are correct

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## 📞 Support

For security-related issues or questions:
- Check the logs for detailed error messages
- Verify your authentication credentials
- Ensure your request format matches the API specification
- Contact the development team for assistance

## 🔄 Migration from Unsecured Endpoints

### Old Endpoints (Deprecated)
- `GET /api/orders` - Now requires authentication
- `POST /api/orders/create` - Now requires authentication
- `PUT /api/orders/:id/status` - Now requires authentication

### New Secure Endpoints
- `GET /api/secure/orders` - Requires staff token
- `POST /api/secure/orders/create` - Requires API key
- `PUT /api/secure/orders/:id/status` - Requires staff token

### Migration Steps
1. Update frontend to use new secure endpoints
2. Add authentication headers to all requests
3. Test all functionality with new authentication
4. Remove old unsecured endpoints after migration
5. Update documentation and API references

---

**⚠️ Important**: The old unsecured endpoints should be removed or disabled after migrating to the secure endpoints to prevent unauthorized access.
