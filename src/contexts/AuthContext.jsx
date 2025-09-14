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
      console.log('🔐 Starting Google sign-in process...');
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      console.log('🔐 Calling Firebase signInWithPopup...');
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Firebase sign-in successful:', result.user.email);
      console.log('📸 User photoURL from Firebase:', result.user.photoURL);
      console.log('👤 User displayName from Firebase:', result.user.displayName);
      
      // Try to sync user to Supabase, but don't fail if it doesn't work
      try {
        console.log('🔄 Attempting to sync user to Supabase...');
        const supabaseUser = await syncUserToSupabase(result.user);
        
        if (supabaseUser) {
          console.log('✅ User synced to Supabase successfully');
          // Update the user state with the latest photoURL from Supabase
          const userData = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            firstName: result.user.displayName?.split(' ')[0] || '',
            lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
            photoURL: supabaseUser.photo_url || result.user.photoURL // Use Supabase photo_url if available
          };
          console.log('📝 Updated userData with Supabase photoURL:', userData);
          setUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
        } else {
          console.warn('⚠️ User sync to Supabase failed, but sign-in continues');
          console.warn('⚠️ Some features may not work properly');
        }
      } catch (supabaseError) {
        console.error('❌ Supabase sync error (non-critical):', supabaseError);
        console.warn('⚠️ User can still use the app, but some features may be limited');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Sign-in failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        userMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        userMessage = 'Sign-in popup was blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/network-request-failed') {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        userMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
      }
      
      // You could show this message to the user via a toast or alert
      console.log('💬 User message:', userMessage);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sync Firebase user to Supabase
  const syncUserToSupabase = async (firebaseUser) => {
    try {
      console.log('🔄 Syncing Firebase user to Supabase:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      });
      
      // Check if user already exists in Supabase by email
      const existingUser = await getUserByEmail(firebaseUser.email);
      console.log('🔍 Existing user check result:', existingUser);
      
      if (existingUser.success && existingUser.user) {
        console.log('✅ User already exists in Supabase:', existingUser.user);
        
        // Update the user's photo_url in Supabase if it's different from Firebase
        if (existingUser.user.photo_url !== firebaseUser.photoURL) {
          console.log('🔄 Updating user photo_url in Supabase...');
          const { updateUser } = await import('../services/supabaseService');
          await updateUser(existingUser.user.id, {
            photo_url: firebaseUser.photoURL
          });
          // Update the returned user object with the new photo_url
          existingUser.user.photo_url = firebaseUser.photoURL;
        }
        
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
      console.log('📝 Create user result:', result);
      
      if (result.success) {
        console.log('✅ User created successfully in Supabase:', result.user);
        return result.user;
      } else {
        console.error('❌ Failed to create user in Supabase:', result.error);
        // Log more details about the failure
        console.error('❌ User data that failed:', userData);
        console.error('❌ Full error details:', result);
        
        // Try to get more specific error information
        if (result.error && result.error.includes('relation "users" does not exist')) {
          console.error('❌ CRITICAL: Users table does not exist in Supabase!');
          console.error('❌ Please run the migration script to recreate the users table.');
        }
        
        // Don't throw error here to avoid breaking the sign-in flow
        // The user can still use the app even if Supabase sync fails
        return null;
      }
    } catch (error) {
      console.error('❌ Error syncing user to Supabase:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Check for specific database errors
      if (error.message && error.message.includes('relation "users" does not exist')) {
        console.error('❌ CRITICAL: Users table does not exist in Supabase!');
        console.error('❌ Please run the migration script to recreate the users table.');
      }
      
      // Don't throw error here to avoid breaking the sign-in flow
      // The user can still use the app even if Supabase sync fails
      return null;
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
        console.log('📸 Firebase user photoURL:', user.photoURL);
        console.log('👤 Firebase user displayName:', user.displayName);
        // User is signed in
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          photoURL: user.photoURL
        };
        console.log('📝 Constructed userData:', userData);
        
        setUser(userData);
        
        // Store user in localStorage for other components to access
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Sync user to Supabase on auth state change
        try {
          const supabaseUser = await syncUserToSupabase(user);
          if (supabaseUser) {
            // Update userData with the latest photoURL from Supabase
            const updatedUserData = {
              ...userData,
              photoURL: supabaseUser.photo_url || user.photoURL
            };
            console.log('📝 Updated userData with Supabase photoURL on auth state change:', updatedUserData);
            setUser(updatedUserData);
            localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
          }
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