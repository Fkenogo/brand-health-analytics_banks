import { CountryCode } from '../types';

// Re-export CountryCode for auth module
export type { CountryCode } from '../types';

// User Roles
export type UserRole = 'respondent' | 'subscriber' | 'admin';

// User Status
export type UserStatus = 'active' | 'suspended' | 'pending' | 'draft' | 'rejected';
export type SubscriptionTier = 'free' | 'standard';

// Permission Types
export type Permission = 
  | 'dashboard:read'
  | 'reports:read'
  | 'reports:export'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'surveys:read'
  | 'surveys:create'
  | 'surveys:update'
  | 'surveys:delete'
  | 'settings:read'
  | 'settings:update';

// User Interface
export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  emailVerified?: boolean;
  
  // Subscriber-specific fields
  assignedCountries?: CountryCode[];
  bankId?: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  requestedCountries?: CountryCode[];
  subscriptionEndsAt?: string;
  subscription_tier?: SubscriptionTier;
  subscription_addon_ai?: boolean;
  ai_usage_count?: number;
  ai_usage_reset_date?: string;
  entitlements_version?: number;
  authUid?: string;
  claimsSyncPending?: boolean;
  claimsLastSyncedAt?: string;
  claimsLastSyncError?: string;
  deviceId?: string;
  lastDeviceSeen?: string;
  
  // Admin-specific fields
  permissions?: Permission[];
  
  // Security fields
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

// Authentication State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Authentication Actions
export type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// Login Credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration Data
export interface RegistrationData {
  email: string;
  password: string;
  companyName?: string;
  assignedCountries?: CountryCode[];
}

// Password Reset
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
}

// Respondent Panel Tracking
export interface RespondentPanel {
  deviceId: string;
  country: CountryCode;
  lastSubmission: string;
  submissionCount: number;
  incentivesEarned: number;
  isActive: boolean;
}

// Device Fingerprint
export interface DeviceFingerprint {
  deviceId: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  colorDepth: string;
  cpuClass?: string;
  platform?: string;
  doNotTrack?: string;
  canvas?: string;
  webgl?: string;
}

// Role Permissions Configuration
export interface RolePermissions {
  [key: string]: Permission[];
}

// Default permissions for each role
export const DEFAULT_PERMISSIONS: RolePermissions = {
  respondent: [],
  subscriber: [
    'dashboard:read',
    'reports:read',
    'reports:export'
  ],
  admin: [
    'dashboard:read',
    'reports:read',
    'reports:export',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'surveys:read',
    'surveys:create',
    'surveys:update',
    'surveys:delete',
    'settings:read',
    'settings:update'
  ]
};

// Helper function to check if user has permission
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // If explicit permissions are set, use them as source of truth
  if (user.permissions) {
    return user.permissions.includes(permission);
  }

  // Otherwise fall back to role defaults
  const rolePermissions = DEFAULT_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
};

// Helper function to check if user can access country
export const canAccessCountry = (user: User | null, country: CountryCode): boolean => {
  if (!user) return false;
  
  // Admin can access all countries
  if (user.role === 'admin') return true;
  
  // Subscriber can only access assigned countries
  if (user.role === 'subscriber') {
    return user.assignedCountries?.includes(country) || false;
  }
  
  // Respondent doesn't need country access check (handled separately)
  return true;
};

// Helper function to get user display name
export const getUserDisplayName = (user: User): string => {
  if (user.role === 'admin') return 'Administrator';
  if (user.role === 'subscriber') return user.companyName || user.email;
  return 'Respondent';
};

// Helper function to check if user account is active
export const isUserActive = (user: User): boolean => {
  return user.status === 'active';
};
