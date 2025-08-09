import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase: Configuration object:', firebaseConfig);

// Check if Firebase config is properly set up
const missingConfig = Object.entries(firebaseConfig).filter(([key, value]) => !value);
if (missingConfig.length > 0) {
  console.error('Firebase: Missing configuration values:', missingConfig.map(([key]) => key));
  console.error('Firebase: This will prevent the app from working properly');
} else {
  console.log('Firebase: All configuration values are present');
}

// Initialize Firebase
console.log('Firebase: Initializing Firebase app...');
const app = initializeApp(firebaseConfig);
console.log('Firebase: Firebase app initialized successfully');

// Initialize Firebase Analytics (only if measurementId is available)
let analytics = null;
try {
  if (firebaseConfig.measurementId) {
    console.log('Firebase: Initializing Analytics...');
    analytics = getAnalytics(app);
    console.log('Firebase: Analytics initialized successfully');
  } else {
    console.log('Firebase: No measurementId provided, skipping Analytics');
  }
} catch (error) {
  console.warn('Firebase: Analytics not available:', error.message);
}

// Initialize Firebase Authentication and get a reference to the service
console.log('Firebase: Initializing Authentication...');
export const auth = getAuth(app);
console.log('Firebase: Authentication initialized successfully');

// Initialize Firestore and get a reference to the service
console.log('Firebase: Initializing Firestore...');
export const db = getFirestore(app);
console.log('Firebase: Firestore initialized successfully');
console.log('Firebase: Firestore db object:', db);
console.log('Firebase: Firestore db type:', typeof db);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
console.log('Firebase: Google Auth Provider initialized');

export { analytics };
export default app; 