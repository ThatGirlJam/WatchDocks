import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// Include 'unauthenticated' in the UserRole type
export type UserRole = 'admin' | 'bikeuser' | 'unauthenticated';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => void;
  logout: () => void;
  userRole: UserRole;
  getAccessTokenSilently: () => Promise<string>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();
  const [userRole, setUserRole] = useState<UserRole>('unauthenticated');

  useEffect(() => {
    // Extract roles from Auth0 user metadata
    const determineRole = () => {
      if (!isAuthenticated || !user) {
        setUserRole('unauthenticated');
        return;
      }

      console.log("Auth0 user object:", user); // Add this to debug the user object structure
      
      // Special case for known admin users by email or ID
      const adminEmails = ['ryan3302@stanford.edu'];
      const adminUserIds = ['google-oauth2|102094749628415975515'];
      
      if (
        // Check specific admin users
        adminEmails.includes(user.email) ||
        adminUserIds.includes(user.sub) ||
        // Standard Auth0 role checks
        user.roles?.includes('admin') || 
        user['https://watchdocks.com/roles']?.includes('admin') ||
        user['https://watchdocks/roles']?.includes('admin') ||
        user.role === 'admin' ||
        (user[`${window.location.origin}/role`] === 'admin') ||
        (user[`${window.location.origin}/roles`]?.includes('admin')) ||
        (Array.isArray(user.permissions) && user.permissions.some(p => p.includes('admin')))
      ) {
        console.log("Setting user role to admin");
        setUserRole('admin');
        return;
      }
      
      console.log("Setting user role to bikeuser (default)");
      // Default to bikeuser if authenticated but no admin role
      setUserRole('bikeuser');
    };

    determineRole();
  }, [isAuthenticated, user]);

  // Make sure loginWithRedirect is called properly
  const login = () => {
    console.log("Login function called"); // Add logging for debugging
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname
      }
    }).catch(err => {
      console.error("Auth0 login error:", err);
    });
  };

  const logout = () => {
    auth0Logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    });
  };

  // Helper function to check permissions
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (requiredRole === 'unauthenticated') return true;
    if (!isAuthenticated) return false;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // For non-admin users, they need exact role match
    return userRole === requiredRole;
  };

  // Context value
  const contextValue = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    userRole,
    getAccessTokenSilently,
    hasPermission
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};