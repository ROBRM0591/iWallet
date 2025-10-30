import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, userProfile } = useAuth();
  const location = useLocation();

  if (!userProfile) {
    // No user profile exists, must go to setup
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }

  if (!isAuthenticated) {
    // User profile exists but is not authenticated, go to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};