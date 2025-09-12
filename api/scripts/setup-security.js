const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Security setup script for Procol ki Rasoi API
 * Generates secure API keys and tokens
 */

console.log('🔐 Setting up API security...\n');

// Generate secure keys
const generateSecureKey = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate all required keys and tokens
const securityConfig = {
  API_KEY_1: generateSecureKey(),
  API_KEY_2: generateSecureKey(),
  STAFF_TOKEN_1: generateSecureToken(),
  STAFF_TOKEN_2: generateSecureToken(),
  ADMIN_TOKEN: generateSecureToken(),
  SESSION_SECRET: generateSecureKey(64),
  JWT_SECRET: generateSecureKey(64)
};

console.log('✅ Generated secure keys and tokens:\n');

// Display the generated keys
Object.entries(securityConfig).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📝 Add these to your .env file:\n');

// Generate .env template
const envTemplate = `# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com

# API Security Keys (Generated)
${Object.entries(securityConfig).map(([key, value]) => `${key}=${value}`).join('\n')}

# Firebase Configuration (Add your Firebase config)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Supabase Configuration (Add your Supabase config)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database Configuration
DATABASE_URL=your-database-connection-string

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/api.log
`;

console.log(envTemplate);

// Save to file
const envPath = path.join(__dirname, '../.env.security');
fs.writeFileSync(envPath, envTemplate);

console.log(`\n💾 Security configuration saved to: ${envPath}`);
console.log('\n🔒 Security Setup Complete!\n');

console.log('📋 Next Steps:');
console.log('1. Copy the generated keys to your .env file');
console.log('2. Update your frontend to use the API keys');
console.log('3. Test the secure endpoints with proper authentication');
console.log('4. Remove or secure the old unauthenticated endpoints\n');

console.log('🛡️  Security Features Added:');
console.log('• API Key authentication');
console.log('• Bearer token authentication');
console.log('• Rate limiting');
console.log('• Request validation');
console.log('• CORS protection');
console.log('• Request sanitization');
console.log('• Helmet security headers\n');

console.log('📚 API Usage Examples:');
console.log('• GET /api/secure/orders (requires staff token)');
console.log('• POST /api/secure/orders/create (requires API key)');
console.log('• PUT /api/secure/orders/:id/status (requires staff token)');
console.log('• DELETE /api/secure/orders/:id (requires admin token)\n');

console.log('🔑 Authentication Methods:');
console.log('1. API Key: X-API-Key header or ?api_key= query param');
console.log('2. Bearer Token: Authorization: Bearer <token>');
console.log('3. Firebase ID Token: Authorization: Firebase <id_token>\n');
