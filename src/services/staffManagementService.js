import { supabase } from './supabaseService';

const USERS_TABLE = 'users';

// Check if user is admin (from database)
export const isAdmin = async (email) => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('is_admin')
      .eq('emailid', email?.toLowerCase())
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data?.is_admin === true;
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
};

// Check if user is admin (synchronous version for existing code)
export const isAdminSync = (user) => {
  console.log('isAdminSync called with user:', user);
  
  // Always treat yugandhar.bhamare@gmail.com as admin (hardcoded fallback)
  const originalAdminEmail = 'yugandhar.bhamare@gmail.com';
  if (user?.emailid?.toLowerCase() === originalAdminEmail.toLowerCase()) {
    console.log('User is admin via hardcoded email check');
    return true;
  }
  
  // Check database is_admin field
  if (user?.is_admin === true) {
    console.log('User is admin via is_admin field');
    return true;
  }
  
  console.log('User is not admin');
  return false;
};

// Get all staff members (users with staff access or admin)
export const getStaffMembers = async () => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff members:', error);
      throw error;
    }

    // Filter to only show staff members and admins
    const staffMembers = (data || []).filter(user => {
      const isStaff = user.is_staff === true;
      const isAdmin = user.is_admin === true;
      const isHardcodedAdmin = user?.emailid?.toLowerCase() === 'yugandhar.bhamare@gmail.com';
      const shouldInclude = isStaff || isAdmin || isHardcodedAdmin;
      console.log(`User ${user.emailid}: is_staff=${user.is_staff}, is_admin=${user.is_admin}, isHardcodedAdmin=${isHardcodedAdmin}, filtered=${shouldInclude}`);
      return shouldInclude;
    });

    console.log('Filtered staff members:', staffMembers);
    return staffMembers;
  } catch (error) {
    console.error('Error in getStaffMembers:', error);
    throw error;
  }
};

// Add new staff member
export const addStaffMember = async (staffData) => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert([{
        name: staffData.name,
        emailid: staffData.email,
        photo_url: staffData.photo_url || null,
        firebase_uid: staffData.firebase_uid || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding staff member:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addStaffMember:', error);
    throw error;
  }
};

// Update staff member
export const updateStaffMember = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        name: updates.name,
        emailid: updates.email,
        photo_url: updates.photo_url || null,
        firebase_uid: updates.firebase_uid || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff member:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateStaffMember:', error);
    throw error;
  }
};

// Delete staff member
export const deleteStaffMember = async (id) => {
  try {
    const { error } = await supabase
      .from(USERS_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting staff member:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteStaffMember:', error);
    throw error;
  }
};

// Get staff member by ID
export const getStaffMemberById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching staff member:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getStaffMemberById:', error);
    throw error;
  }
};

// Check if email already exists
export const checkEmailExists = async (email, excludeId = null) => {
  try {
    let query = supabase
      .from(USERS_TABLE)
      .select('id, emailid')
      .eq('emailid', email);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking email:', error);
      throw error;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    throw error;
  }
};

// Add admin email
export const addAdminEmail = (email) => {
  const normalizedEmail = email?.toLowerCase();
  if (normalizedEmail && !ADMIN_EMAILS.includes(normalizedEmail)) {
    ADMIN_EMAILS.push(normalizedEmail);
    return true;
  }
  return false;
};

// Remove admin email
export const removeAdminEmail = (email) => {
  const normalizedEmail = email?.toLowerCase();
  const index = ADMIN_EMAILS.indexOf(normalizedEmail);
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
    return true;
  }
  return false;
};

// Get all admin emails
export const getAdminEmails = () => {
  return [...ADMIN_EMAILS];
};

// Get users who are not staff or admin (regular customers)
export const getNonStaffUsers = async () => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    console.log('All users fetched:', data);

    // Filter out users who are already staff or admin
    const nonStaffUsers = (data || []).filter(user => {
      const isStaff = user.is_staff === true;
      const isAdminUser = user.is_admin === true;
      const isHardcodedAdmin = user?.emailid?.toLowerCase() === 'yugandhar.bhamare@gmail.com';
      
      const shouldExclude = isStaff || isAdminUser || isHardcodedAdmin;
      
      console.log(`User ${user.emailid}: is_staff=${user.is_staff}, is_admin=${user.is_admin}, isHardcodedAdmin=${isHardcodedAdmin}, excluded=${shouldExclude}`);
      
      return !shouldExclude;
    });

    console.log('Filtered non-staff users:', nonStaffUsers);
    return nonStaffUsers;
  } catch (error) {
    console.error('Error in getNonStaffUsers:', error);
    throw error;
  }
};

// Promote a user to staff
export const promoteUserToStaff = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({ is_staff: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error promoting user to staff:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in promoteUserToStaff:', error);
    throw error;
  }
};

// Remove staff access from a user
export const removeStaffAccess = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({ is_staff: false })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error removing staff access:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in removeStaffAccess:', error);
    throw error;
  }
};

// Change user role (promote to admin or downgrade to staff)
export const changeUserRole = async (userId, newRole) => {
  try {
    const updates = newRole === 'admin' 
      ? { is_admin: true, is_staff: true }  // Admins are also staff
      : { is_admin: false, is_staff: true }; // Staff members
    
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error changing user role:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in changeUserRole:', error);
    throw error;
  }
};

// Check if user can be removed (not an admin)
export const canRemoveUser = (user) => {
  return !user?.is_admin;
};
