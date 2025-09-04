// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
const missingConfig = Object.entries(firebaseConfig).filter(([key, value]) => !value || value.includes('your_'));
if (missingConfig.length > 0) {
  console.error('❌ Missing or invalid Firebase configuration values:', missingConfig.map(([key]) => key));
  console.error('❌ Please update your .env file with actual Firebase credentials');
  
  // Show error in the UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto;">
        <h1 style="color: red;">🚨 Firebase Configuration Error</h1>
        <p>Your Firebase credentials are missing or invalid. Please update your <code>.env</code> file with actual values.</p>
        
        <h3>Missing/Invalid Values:</h3>
        <ul style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${missingConfig.map(([key]) => `<li><code>${key}</code></li>`).join('')}
        </ul>
        
        <h3>How to Fix:</h3>
        <ol>
          <li>Go to <a href="https://console.firebase.google.com/" target="_blank">Firebase Console</a></li>
          <li>Select your project</li>
          <li>Click ⚙️ → Project Settings</li>
          <li>Scroll to "Your apps" section</li>
          <li>Copy the configuration values</li>
          <li>Update your <code>.env</code> file</li>
          <li>Restart the development server</li>
        </ol>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>Example .env file:</strong><br>
          <code style="background: #f8f9fa; padding: 5px; border-radius: 3px;">
            VITE_FIREBASE_API_KEY=AIzaSyC...your_actual_api_key<br>
            VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com<br>
            VITE_FIREBASE_PROJECT_ID=your-project-id
          </code>
        </div>
        
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload After Fixing</button>
      </div>
    `;
  }
  
  throw new Error('Firebase configuration is incomplete. Please check your .env file.');
}

console.log('✅ Firebase configuration is complete');

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider with custom parameters
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account picker
  access_type: 'offline',   // Get refresh token
  include_granted_scopes: true
});

// Add scopes if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    // Uncomment these lines if you want to use Firebase emulators
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Development mode: Firebase emulators available');
  } catch (error) {
    console.log('🔧 Development mode: Firebase emulators not connected');
  }
}

// Export the app instance
export default app; 