import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Route protection wrapper.
 * Prevents unauthorized users from accessing student application views.
 */
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-slate-600 font-medium animate-pulse">
          Verifying session...
        </p>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated visitors to login, preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
