import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context';
import { Permission, hasPermission } from '../types';
import { getRoleHomePath } from '../routing';

interface RequirePermissionProps {
  children: React.ReactNode;
  permission: Permission;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Permission-Based Access Guard
 * Restricts access based on user permissions
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  children, 
  permission,
  redirectTo,
  fallback 
}) => {
  const { state } = useAuth();

  // If not authenticated, use RequireAuth instead
  if (!state.isAuthenticated || !state.user) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : null;
  }

  // Check if user has the required permission
  const canAccess = hasPermission(state.user, permission);

  if (!canAccess) {
    // If fallback provided, show it instead of redirecting
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback: redirect to dashboard
    const roleHome = getRoleHomePath(state.user.role);
    return <Navigate to={redirectTo || roleHome} replace />;
  }

  return <>{children}</>;
};

// Convenience components for common permissions
export const RequireDashboardAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequirePermission 
    permission="dashboard:read" 
    fallback={fallback}
  >
    {children}
  </RequirePermission>
);

export const RequireReportsAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequirePermission 
    permission="reports:read" 
    fallback={fallback}
  >
    {children}
  </RequirePermission>
);

export const RequireReportsExport: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequirePermission 
    permission="reports:export" 
    fallback={fallback}
  >
    {children}
  </RequirePermission>
);

export const RequireUserManagement: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequirePermission 
    permission="users:read" 
    fallback={fallback}
  >
    {children}
  </RequirePermission>
);

export const RequireSurveyManagement: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequirePermission 
    permission="surveys:read" 
    fallback={fallback}
  >
    {children}
  </RequirePermission>
);
