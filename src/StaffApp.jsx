import { Routes, Route, Navigate } from 'react-router-dom';
import { StaffAuthProvider, useStaffAuth } from './contexts/StaffAuthContext';
import { StaffOrderProvider } from './contexts/StaffOrderContext';
import StaffLoginScreen from './components/StaffLoginScreen';
import StaffDashboard from './components/StaffDashboard';
import MenuManagement from './components/MenuManagement';
import StaffMembersPage from './components/StaffMembersPage';

// Staff Dashboard Page Component
function StaffDashboardPage() {
  const { staffUser, loading, error } = useStaffAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff portal...</p>
        </div>
      </div>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h2>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please check your Firebase configuration and ensure all environment variables are set.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if user is not authenticated
  if (!staffUser) {
    return <StaffLoginScreen />;
  }

  return (
    <StaffOrderProvider>
      <StaffDashboard />
    </StaffOrderProvider>
  );
}

// Menu Management Page Component
function MenuManagementPage() {
  const { staffUser, loading, error } = useStaffAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu management...</p>
        </div>
      </div>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h2>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please check your Firebase configuration and ensure all environment variables are set.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if user is not authenticated
  if (!staffUser) {
    return <StaffLoginScreen />;
  }

  return (
    <StaffOrderProvider>
      <MenuManagement />
    </StaffOrderProvider>
  );
}

// Staff Members Page Component
function StaffMembersPageWrapper() {
  const { staffUser, loading, error } = useStaffAuth();

  // Show loading screen while checking authentication
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

  // Show error if there's an issue
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h2>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please check your Firebase configuration and ensure all environment variables are set.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if user is not authenticated
  if (!staffUser) {
    return <StaffLoginScreen />;
  }

  return (
    <StaffOrderProvider>
      <StaffMembersPage />
    </StaffOrderProvider>
  );
}

// Main Staff App Component
function StaffApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StaffAuthProvider>
        <Routes>
          <Route path="/" element={<StaffDashboardPage />} />
          <Route path="/menu" element={<MenuManagementPage />} />
          <Route path="/members" element={<StaffMembersPageWrapper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StaffAuthProvider>
    </div>
  );
}

export default StaffApp;
