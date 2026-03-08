import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
import { UserRole } from '../types';
import { getRoleEntryPath } from '../routing';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Role-Based Access Guard
 * Restricts access based on user role
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ 
  children, 
  allowedRoles,
  redirectTo,
  fallback 
}) => {
  const { state, logout } = useAuth();
  const location = useLocation();

  // If not authenticated, use RequireAuth instead
  if (!state.isAuthenticated || !state.user) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : null;
  }

  // Block subscribers who are not active from subscriber routes
  if (state.user.role === 'subscriber' && state.user.status !== 'active') {
    if (location.pathname === '/dashboard/pending') {
      return <>{children}</>;
    }
    return <Navigate to="/dashboard/pending" replace />;
  }

  // Check if user role is allowed
  const isAllowed = allowedRoles.includes(state.user.role);

  if (!isAllowed) {
    // If fallback provided, show it instead of redirecting
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback: force logout and redirect to entry point
    const entryPath = getRoleEntryPath(state.user.role);
    logout();
    return <Navigate to={redirectTo || entryPath} replace />;
  }

  return <>{children}</>;
};

// Convenience components for common role checks
export const RequireAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequireRole 
    allowedRoles={['admin']} 
    fallback={fallback}
  >
    {children}
  </RequireRole>
);

export const RequireSubscriber: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequireRole 
    allowedRoles={['subscriber', 'admin']} 
    fallback={fallback}
  >
    {children}
  </RequireRole>
);

export const RequireAuthenticated: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequireRole 
    allowedRoles={['subscriber', 'admin']} 
    fallback={fallback}
  >
    {children}
  </RequireRole>
);
