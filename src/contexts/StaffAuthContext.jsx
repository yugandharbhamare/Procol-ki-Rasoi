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
      
      // Check if the user is authorized staff by querying the database
      try {
        const { supabase } = await import('../services/supabaseService');
        const { data: supabaseUser, error } = await supabase
          .from('users')
          .select('is_staff, is_admin')
          .eq('emailid', user.email)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking staff status:', error);
        }
        
        // Check if user is staff or admin, or if they're in the hardcoded list (fallback)
        const isStaff = supabaseUser?.is_staff || supabaseUser?.is_admin || AUTHORIZED_STAFF_EMAILS.includes(user.email);
        
        if (!isStaff) {
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
          throw new Error('Unauthorized access. Only staff members can access this interface.');
        }
      } catch (dbError) {
        console.error('Error checking staff status in database:', dbError);
        // Fallback to hardcoded list if database check fails
        if (!AUTHORIZED_STAFF_EMAILS.includes(user.email)) {
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
          throw new Error('Unauthorized access. Only staff members can access this interface.');
        }
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

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('StaffAuthProvider: Auth state changed', user);
          
          if (user) {
            // Check if user is authorized staff by querying the database
            let isAuthorized = false;
            
            try {
              const { supabase } = await import('../services/supabaseService');
              const { data: supabaseUser, error } = await supabase
                .from('users')
                .select('is_staff, is_admin')
                .eq('emailid', user.email)
                .single();
              
              if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error checking staff status:', error);
              }
              
              // Check if user is staff or admin, or if they're in the hardcoded list (fallback)
              isAuthorized = supabaseUser?.is_staff || supabaseUser?.is_admin || AUTHORIZED_STAFF_EMAILS.includes(user.email);
            } catch (dbError) {
              console.error('Error checking staff status in database:', dbError);
              // Fallback to hardcoded list if database check fails
              isAuthorized = AUTHORIZED_STAFF_EMAILS.includes(user.email);
            }
            
            if (isAuthorized) {
              // User is signed in and is authorized staff
              console.log('StaffAuthProvider: Authorized user found', user.email);
            
            // Sync with Supabase to get user role information
            try {
              const { supabase } = await import('../services/supabaseService');
              const { data: supabaseUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('emailid', user.email)
                .single();
              
              if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching user from Supabase:', error);
              }
              
              console.log('Supabase user data:', supabaseUser);
              
              setStaffUser({
                uid: user.uid,
                email: user.email,
                emailid: user.email, // Add emailid for compatibility
                displayName: user.displayName,
                name: user.displayName, // Add name for compatibility
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                photoURL: user.photoURL,
                photo_url: user.photoURL, // Add photo_url for compatibility
                role: 'staff',
                // Add Supabase fields
                id: supabaseUser?.id,
                is_admin: supabaseUser?.is_admin || false,
                is_staff: supabaseUser?.is_staff || true, // Default to true for authorized staff
                created_at: supabaseUser?.created_at
              });
            } catch (syncError) {
              console.error('Error syncing with Supabase:', syncError);
              // Fallback to basic user data
              setStaffUser({
                uid: user.uid,
                email: user.email,
                emailid: user.email,
                displayName: user.displayName,
                name: user.displayName,
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                photoURL: user.photoURL,
                photo_url: user.photoURL,
                role: 'staff',
                is_admin: false,
                is_staff: true
              });
            }
            setError(null);
            } else {
              // User is signed in but not authorized staff
              console.log('StaffAuthProvider: Unauthorized user', user.email);
              setStaffUser(null);
              setError('Unauthorized access. Only staff members can access this interface.');
              signOut(auth);
            }
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
