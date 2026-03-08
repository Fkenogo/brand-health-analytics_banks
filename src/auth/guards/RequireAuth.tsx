import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
import { Loader2 } from 'lucide-react';
import { getRoleEntryPath } from '../routing';

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Authentication Guard
 * Redirects to login if user is not authenticated
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { state, logout } = useAuth();
  const location = useLocation();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    // Save the location they were trying to go to
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (state.user?.role === 'subscriber' && state.user.status !== 'active') {
    if (location.pathname !== '/dashboard/pending') {
      return <Navigate to="/dashboard/pending" replace />;
    }
  }

  if (state.user?.role === 'respondent') {
    logout();
    return <Navigate to={getRoleEntryPath('respondent')} replace />;
  }

  return <>{children}</>;
};
