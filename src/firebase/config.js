import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwb2uIYEcu2OKiskBNV4esfLwJWjQoKNg",
  authDomain: "procol-ki-rasoi.firebaseapp.com",
  projectId: "procol-ki-rasoi",
  storageBucket: "procol-ki-rasoi.firebasestorage.app",
  messagingSenderId: "431487577660",
  appId: "1:431487577660:web:6ecbb7ff316e0b7b089d39",
  measurementId: "G-137G0QQSFF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export { analytics };
export default app; 