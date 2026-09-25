import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../hooks/useToast.js';
import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Route protection wrapper for Platform Administration.
 * Prevents regular students or unauthenticated visitors from accessing administrative views.
 */
export const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error('Access restricted: Platform administrator privileges required.');
    }
  }, [loading, user, isAdmin, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-slate-600 font-medium animate-pulse">
          Verifying administrative privileges...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;
