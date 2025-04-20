import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'admin'
}) => {
  const { isAuthenticated, isLoading, hasPermission, login } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and has required role
  if (!isAuthenticated) {
    // Store the current path to redirect back after login
    login();
    return null;
  }

  if (!hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h1>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
            <p className="text-gray-800 dark:text-gray-200">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Your current role is: <span className="font-semibold">{requiredRole}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              This area requires admin privileges. Please contact your system administrator if you believe you should have access.
            </p>
          </div>
          
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and has permission, render the children
  return <>{children}</>;
};