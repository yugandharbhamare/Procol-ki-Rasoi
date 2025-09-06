import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getStaffMembers, 
  removeStaffAccess,
  changeUserRole,
  canRemoveUser,
  isAdminSync 
} from '../services/staffManagementService';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import AddStaffModal from './AddStaffModal';

const StaffMembersPage = () => {
  const navigate = useNavigate();
  const { staffUser } = useStaffAuth();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(null);

  // Simple sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Check if current user is admin
  const userIsAdmin = useMemo(() => {
    console.log('Staff user object:', staffUser);
    console.log('Is admin sync result:', isAdminSync(staffUser));
    return isAdminSync(staffUser);
  }, [staffUser]);

  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      const members = await getStaffMembers();
      setStaffMembers(members);
      setError(null);
    } catch (err) {
      console.error('Error loading staff members:', err);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffMembers();
  }, []);

  // Sorted staff members
  const sortedMembers = useMemo(() => {
    const sorted = [...staffMembers];

    // Apply sorting
    sorted.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [staffMembers, sortBy, sortOrder]);

  const handleAddMember = () => {
    setShowAddModal(true);
  };

  const handleStaffAdded = async (user) => {
    // Reload staff members to show the newly added staff
    await loadStaffMembers();
  };

  const handleRemoveStaff = async (member) => {
    try {
      await removeStaffAccess(member.id);
      setRemoveConfirm(null);
      await loadStaffMembers();
    } catch (error) {
      console.error('Error removing staff access:', error);
      setError('Failed to remove staff access');
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleRoleChange = async (member, newRole) => {
    try {
      await changeUserRole(member.id, newRole);
      setRoleDropdownOpen(null);
      await loadStaffMembers();
    } catch (error) {
      console.error('Error changing user role:', error);
      setError('Failed to change user role');
    }
  };

  const toggleRoleDropdown = (memberId) => {
    setRoleDropdownOpen(roleDropdownOpen === memberId ? null : memberId);
  };

  const getUserRole = (member) => {
    return isAdminSync(member) ? 'admin' : 'staff';
  };

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownOpen && !event.target.closest('.role-dropdown-container')) {
        setRoleDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roleDropdownOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/staff/')}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Staff Members</h1>
                <p className="text-sm text-gray-500">Manage staff members and their access to the portal</p>
              </div>
            </div>
            {userIsAdmin && (
              <button
                onClick={handleAddMember}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Staff Member
              </button>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}


        {/* Staff Members Table */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortBy === 'name' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('emailid')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortBy === 'emailid' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {member.photo_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={member.photo_url}
                              alt={member.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium ${
                              member.photo_url ? 'hidden' : 'flex'
                            }`}
                          >
                            {member.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.emailid}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative role-dropdown-container">
                        <button
                          onClick={() => toggleRoleDropdown(member.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                            isAdminSync(member)
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isAdminSync(member) ? 'Admin' : 'Staff'}
                          <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {roleDropdownOpen === member.id && (
                          <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                            <div className="py-1">
                              <button
                                onClick={() => handleRoleChange(member, 'staff')}
                                className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                                  !isAdminSync(member) ? 'bg-green-50 text-green-800' : 'text-gray-700'
                                }`}
                              >
                                Staff
                              </button>
                              <button
                                onClick={() => handleRoleChange(member, 'admin')}
                                className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                                  isAdminSync(member) ? 'bg-purple-50 text-purple-800' : 'text-gray-700'
                                }`}
                              >
                                Admin
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(() => {
                        const memberIsAdmin = isAdminSync(member);
                        const memberIsStaff = member.is_staff;
                        
                        // Only admins can perform actions
                        if (!userIsAdmin) {
                          return <span className="text-gray-400 text-xs">-</span>;
                        }
                        
                        // If member is admin, show protected
                        if (memberIsAdmin) {
                          return <span className="text-gray-400 text-xs">Protected</span>;
                        }
                        
                        // If member is staff (but not admin), show remove button
                        if (memberIsStaff) {
                          return (
                            <button
                              onClick={() => setRemoveConfirm(member)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          );
                        }
                        
                        // Default case
                        return <span className="text-gray-400 text-xs">-</span>;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {sortedMembers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new staff member.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onStaffAdded={handleStaffAdded}
        />
      )}

      {/* Remove Staff Confirmation Modal */}
      {removeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Remove Staff Access</h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove staff access for <strong>{removeConfirm.name}</strong>? They will no longer have access to the staff portal but their account will remain active.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setRemoveConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveStaff(removeConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Remove Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffMembersPage;
