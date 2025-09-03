import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { createUser, getUser, getUserByEmail } from '../services/supabaseService';

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google sign-in process...');
      
      // Check if Firebase is properly configured
      if (!auth || !googleProvider) {
        throw new Error('Firebase authentication not properly configured');
      }

      // Check if we're in a popup-friendly environment
      if (window.opener) {
        console.log('⚠️  Detected popup environment, this might cause issues');
      }

      console.log('📱 Calling signInWithPopup...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Google sign-in successful:', result.user.email);
      
      // Create or update user in Supabase
      await syncUserToSupabase(result.user);
      
      return result.user;
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Sign-in failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        userMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        userMessage = 'Pop-up was blocked. Please allow pop-ups for this site and try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        userMessage = 'This domain is not authorized for sign-in. Please contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        userMessage = 'Google sign-in is not enabled. Please contact support.';
      }
      
      // Create a new error with user-friendly message
      const userError = new Error(userMessage);
      userError.originalError = error;
      throw userError;
    }
  };

  // Sync Firebase user to Supabase
  const syncUserToSupabase = async (firebaseUser) => {
    try {
      console.log('🔄 Syncing Firebase user to Supabase:', firebaseUser.uid);
      
      // Check if user already exists in Supabase by email
      const existingUser = await getUserByEmail(firebaseUser.email);
      
      if (existingUser.success && existingUser.user) {
        console.log('✅ User already exists in Supabase:', existingUser.user);
        return existingUser.user;
      }
      
      // Create new user in Supabase (let Supabase generate UUID)
      const userData = {
        name: firebaseUser.displayName || 'Unknown User',
        emailid: firebaseUser.email || '',
        firebase_uid: firebaseUser.uid, // Store Firebase UID for reference
        photo_url: firebaseUser.photoURL || null // Store Google profile photo URL
      };
      
      console.log('📝 Creating new user in Supabase:', userData);
      const result = await createUser(userData);
      
      if (result.success) {
        console.log('✅ User created successfully in Supabase:', result.user);
        return result.user;
      } else {
        console.error('❌ Failed to create user in Supabase:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error syncing user to Supabase:', error);
      // Don't throw error here to avoid breaking the sign-in flow
      // The user can still use the app even if Supabase sync fails
    }
  };

  // Sign out
  const signOutUser = async () => {
    try {
      console.log('🚪 Signing out user...');
      await signOut(auth);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('👂 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('👤 User signed in:', user.email);
        // User is signed in
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          photoURL: user.photoURL
        };
        
        setUser(userData);
        
        // Store user in localStorage for other components to access
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Sync user to Supabase on auth state change
        try {
          await syncUserToSupabase(user);
        } catch (error) {
          console.error('❌ Error syncing user on auth state change:', error);
        }
      } else {
        console.log('👤 User signed out');
        // User is signed out
        setUser(null);
        localStorage.removeItem('currentUser');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 