import React, { createContext, useContext, useState, useEffect } from 'react';

const StaffAuthContext = createContext();

const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};

export { useStaffAuth };

// Staff email addresses that are authorized to access the staff interface
const AUTHORIZED_STAFF_EMAILS = [
  'yugandhar.bhamare@gmail.com',
  'design@procol.in',
  // Add more staff emails as needed
];

export const StaffAuthProvider = ({ children }) => {
  const [staffUser, setStaffUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if Firebase is available
  const isFirebaseAvailable = () => {
    try {
      return true; // We'll check this when we actually try to import
    } catch (error) {
      console.error('Firebase not available:', error);
      return false;
    }
  };

  // Sign in with Google for staff
  const signInWithGoogle = async () => {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please check your environment variables.');
      }

      const { auth, googleProvider } = await import('../firebase/config');
      const { signInWithPopup } = await import('firebase/auth');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if the user is authorized staff
      if (!AUTHORIZED_STAFF_EMAILS.includes(user.email)) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        throw new Error('Unauthorized access. Only staff members can access this interface.');
      }
      
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const signOutUser = async () => {
    try {
      if (!isFirebaseAvailable()) {
        setStaffUser(null);
        return;
      }

      const { auth } = await import('../firebase/config');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('StaffAuthProvider: Initializing auth listener');
    
    if (!isFirebaseAvailable()) {
      console.error('Firebase not configured');
      setLoading(false);
      setError('Firebase authentication not configured. Please check your environment variables.');
      return;
    }

    let unsubscribe = null;

    const initializeAuth = async () => {
      try {
        const { auth } = await import('../firebase/config');
        const { onAuthStateChanged, signOut } = await import('firebase/auth');

        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('StaffAuthProvider: Auth state changed', user);
          
          if (user && AUTHORIZED_STAFF_EMAILS.includes(user.email)) {
            // User is signed in and is authorized staff
            console.log('StaffAuthProvider: Authorized user found', user.email);
            setStaffUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              photoURL: user.photoURL,
              role: 'staff'
            });
            setError(null);
          } else if (user && !AUTHORIZED_STAFF_EMAILS.includes(user.email)) {
            // User is signed in but not authorized staff
            console.log('StaffAuthProvider: Unauthorized user', user.email);
            setStaffUser(null);
            setError('Unauthorized access. Only staff members can access this interface.');
            signOut(auth);
          } else {
            // User is signed out
            console.log('StaffAuthProvider: No user signed in');
            setStaffUser(null);
            setError(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('StaffAuthProvider: Auth state error', error);
          setError(error.message);
          setLoading(false);
        });
      } catch (error) {
        console.error('StaffAuthProvider: Initialization error', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    staffUser,
    loading,
    error,
    signInWithGoogle,
    signOutUser
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};
