import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useStore from './store/useStore';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Loans from './pages/Loans/Loans';
import Documents from './pages/Documents/Documents';
import Payments from './pages/Payments/Payments';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Component that loads customer data after authentication
const AuthenticatedContent = () => {
  const { loadCustomerData, dataLoaded, isLoading, error } = useStore();
  const { user } = useAuth();

  useEffect(() => {
    if (!dataLoaded && user) {
      loadCustomerData();
    }
  }, [dataLoaded, user, loadCustomerData]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading your account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Unable to load your account</h2>
        <p>{error}</p>
        <button onClick={() => loadCustomerData()}>Try Again</button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="loans" element={<Loans />} />
        <Route path="documents" element={<Documents />} />
        <Route path="payments" element={<Payments />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Dashboard />} />
        <Route path="support" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main app content with routing
const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AuthenticatedContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
