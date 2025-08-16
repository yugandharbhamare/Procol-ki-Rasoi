#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔥 Firebase Configuration Setup for Order Management API');
console.log('=====================================================\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupFirebase() {
  try {
    console.log('Please provide your Firebase configuration details.\n');
    console.log('You can find these in your Firebase Console:');
    console.log('1. Go to https://console.firebase.google.com/');
    console.log('2. Select your project');
    console.log('3. Go to Project Settings (gear icon)');
    console.log('4. Scroll down to "Your apps" section');
    console.log('5. Copy the config values\n');

    const apiKey = await question('Firebase API Key: ');
    const authDomain = await question('Firebase Auth Domain: ');
    const projectId = await question('Firebase Project ID: ');
    const storageBucket = await question('Firebase Storage Bucket: ');
    const messagingSenderId = await question('Firebase Messaging Sender ID: ');
    const appId = await question('Firebase App ID: ');
    const measurementId = await question('Firebase Measurement ID (optional, press Enter to skip): ');

    // Create .env file content
    const envContent = `# Firebase Configuration for Order Management API
# Generated on ${new Date().toISOString()}

FIREBASE_API_KEY=${apiKey}
FIREBASE_AUTH_DOMAIN=${authDomain}
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_STORAGE_BUCKET=${storageBucket}
FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
FIREBASE_APP_ID=${appId}
${measurementId ? `FIREBASE_MEASUREMENT_ID=${measurementId}` : '# FIREBASE_MEASUREMENT_ID=your_measurement_id_here'}

# API Configuration
PORT=3001
NODE_ENV=development
`;

    // Write .env file
    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Firebase configuration saved to .env file!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Auth Domain: ${authDomain}`);
    console.log(`   API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`   App ID: ${appId}`);

    console.log('\n🚀 Next Steps:');
    console.log('1. Start the API server: npm run dev');
    console.log('2. Test the API: node testOrderManagement.js');
    console.log('3. Check the health endpoint: http://localhost:3001/health');

    console.log('\n⚠️  Important:');
    console.log('- Keep your .env file secure and never commit it to version control');
    console.log('- The .env file is already added to .gitignore');
    console.log('- Make sure your Firebase project has Firestore enabled');

  } catch (error) {
    console.error('❌ Error setting up Firebase configuration:', error.message);
  } finally {
    rl.close();
  }
}

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  question('Do you want to overwrite it? (y/N): ').then((answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      setupFirebase();
    } else {
      console.log('Setup cancelled.');
      rl.close();
    }
  });
} else {
  setupFirebase();
}
