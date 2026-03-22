import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthAction, User, UserStatus, UserRole, CountryCode } from './types';
import { authStorage } from './utils';
import { auth } from '@/lib/firebase';
import { firebaseRuntimeDebug } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  type AuthError,
} from 'firebase/auth';
import { userService } from '@/services/userService';
import { adminAccessService } from '@/services/adminAccessService';

// Auth Context Type
interface AuthContextType {
  state: AuthState;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  register: (data: { email: string; password: string; companyName?: string }) => Promise<void>;
  signInWithGoogleFree: (options: { requestedCountry: CountryCode; companyName?: string; contactName?: string }) => Promise<User>;
  forgotPassword: (email: string, options?: { continuePath?: string }) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyPasswordReset: (token: string) => Promise<string>;
  updateUser: (userData: Partial<User>) => void;
  refreshAdminAccess: () => Promise<User>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'UPDATE_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
}

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const debugAuth = typeof window !== 'undefined'
    && (
      import.meta.env.DEV
      || window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1'
      || window.location.hostname.includes('--preview-')
      || window.location.hostname.endsWith('.web.app')
      || window.location.hostname.endsWith('.firebaseapp.com')
    );

  const loadProfileByUid = async (uid: string): Promise<User | null> => {
    if (!uid) return null;
    return userService.getUserById(uid);
  };

  const attachRuntimeClaims = async (firebaseUser: { getIdTokenResult: (forceRefresh?: boolean) => Promise<{ claims: Record<string, unknown> }> }, userDoc: User): Promise<User> => {
    let tokenResult = await firebaseUser.getIdTokenResult(true);
    let tokenRole = String(tokenResult?.claims?.role || '');

    if (userDoc.role === 'admin' && tokenRole !== 'admin') {
      try {
        await adminAccessService.repairMyAdminClaims();
        tokenResult = await firebaseUser.getIdTokenResult(true);
        tokenRole = String(tokenResult?.claims?.role || '');
      } catch (_error) {
        // Recovery remains available in guarded admin UI if explicit repair is still needed.
      }
    }

    return {
      ...userDoc,
      runtimeClaimsRole: tokenRole || null,
      hasAdminClaim: tokenRole === 'admin',
      claimsMismatch: userDoc.role === 'admin' && tokenRole !== 'admin',
    };
  };

  // Initialize auth state from storage
  useEffect(() => {
    let resolvedInitialState = false;
    const finishInitialLoad = () => {
      if (resolvedInitialState) return;
      resolvedInitialState = true;
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    const bootstrapTimeout = window.setTimeout(() => {
      console.warn('[auth:init] timed out waiting for Firebase auth bootstrap. Falling back to signed-out state.', {
        origin: firebaseRuntimeDebug.origin,
        host: firebaseRuntimeDebug.host,
        authDomain: firebaseRuntimeDebug.authDomain,
        projectId: firebaseRuntimeDebug.projectId,
      });
      authStorage.clear();
      dispatch({ type: 'LOGOUT' });
      finishInitialLoad();
    }, 8000);

    if (debugAuth) {
      console.info('[auth:init] subscribing to onAuthStateChanged', {
        origin: firebaseRuntimeDebug.origin,
        host: firebaseRuntimeDebug.host,
        authDomain: firebaseRuntimeDebug.authDomain,
        projectId: firebaseRuntimeDebug.projectId,
      });
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          if (debugAuth) {
            console.info('[auth:init] no authenticated user');
          }
          authStorage.clear();
          dispatch({ type: 'LOGOUT' });
          return;
        }
        if (debugAuth) {
          console.info('[auth:init] firebase user detected', { uid: firebaseUser.uid });
        }
        const userDoc = await loadProfileByUid(firebaseUser.uid);
        if (!userDoc) {
          authStorage.clear();
          dispatch({ type: 'LOGOUT' });
          return;
        }
        const hydratedUser = await attachRuntimeClaims(firebaseUser, userDoc);
        authStorage.setUser(hydratedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: hydratedUser });
      } catch (error) {
        console.error('Auth initialization error:', error, debugAuth ? {
          origin: firebaseRuntimeDebug.origin,
          host: firebaseRuntimeDebug.host,
          authDomain: firebaseRuntimeDebug.authDomain,
          projectId: firebaseRuntimeDebug.projectId,
          code: getAuthErrorCode(error),
        } : undefined);
        dispatch({ type: 'LOGOUT' });
      } finally {
        window.clearTimeout(bootstrapTimeout);
        finishInitialLoad();
      }
    });

    return () => {
      resolvedInitialState = true;
      window.clearTimeout(bootstrapTimeout);
      unsubscribe();
    };
  }, [debugAuth]);

  // Login Function
  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      if (debugAuth) {
        console.info('[auth:login] sign-in request start', {
          email: credentials.email,
          origin: firebaseRuntimeDebug.origin,
          authDomain: firebaseRuntimeDebug.authDomain,
          projectId: firebaseRuntimeDebug.projectId,
        });
      }
      const result = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const userDoc = await loadProfileByUid(result.user.uid);
      if (!userDoc) {
        throw new Error('Account profile not found.');
      }
      const updatedUser = {
        ...(await attachRuntimeClaims(result.user, userDoc)),
        lastLogin: new Date().toISOString(),
      };
      authStorage.setUser(updatedUser);
      dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
      return updatedUser;
    } catch (error) {
      if (debugAuth) {
        console.error('[auth:login] sign-in failed', {
          code: getAuthErrorCode(error),
          message: error instanceof Error ? error.message : String(error),
          origin: firebaseRuntimeDebug.origin,
          host: firebaseRuntimeDebug.host,
          authDomain: firebaseRuntimeDebug.authDomain,
          projectId: firebaseRuntimeDebug.projectId,
        });
      }
      const errorMessage = getLoginErrorMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Logout Function
  const logout = () => {
    authStorage.clear();
    signOut(auth);
    dispatch({ type: 'LOGOUT' });
  };

  // Register Function (Admin only for creating subscribers)
  const register = async (data: { email: string; password: string; companyName?: string }) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      if (!state.user || state.user.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can create users');
      }
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await userService.createAdmin(result.user.uid, data.email);
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const signInWithGoogleFree = async (options: { requestedCountry: CountryCode; companyName?: string; contactName?: string }): Promise<User> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const inferredContactName = options.contactName?.trim() || result.user.displayName || undefined;
      const inferredCompanyName = options.companyName?.trim() || result.user.displayName || result.user.email || undefined;

      await userService.createFreeSubscriberSelfServe({
        requestedCountry: options.requestedCountry,
        companyName: inferredCompanyName,
        contactName: inferredContactName,
      });

      await result.user.getIdToken(true);

      const userDoc = await loadProfileByUid(result.user.uid);
      if (!userDoc) {
        throw new Error('Free access profile could not be created.');
      }

      const hydratedUser = await attachRuntimeClaims(result.user, userDoc);
      authStorage.setUser(hydratedUser);
      dispatch({ type: 'LOGIN_SUCCESS', payload: hydratedUser });
      return hydratedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google signup failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Forgot Password Function
  const forgotPassword = async (email: string, options?: { continuePath?: string }) => {
    try {
      await sendPasswordResetEmail(auth, email, buildPasswordResetActionSettings(options?.continuePath));
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      if (isPasswordResetNonDisclosureError(error)) {
        dispatch({ type: 'CLEAR_ERROR' });
        return;
      }
      const errorMessage = getPasswordResetRequestMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Reset Password Function
  const resetPassword = async (token: string, password: string) => {
    try {
      await confirmPasswordReset(auth, token, password);
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      const errorMessage = getPasswordResetConfirmMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const verifyPasswordReset = async (token: string): Promise<string> => {
    try {
      return await verifyPasswordResetCode(auth, token);
    } catch (error) {
      const errorMessage = getPasswordResetConfirmMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Update User Function
  const updateUser = (userData: Partial<User>) => {
    if (!state.user) return;
    
    const updatedUser = { ...state.user, ...userData };
    authStorage.setUser(updatedUser);
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const refreshAdminAccess = async (): Promise<User> => {
    if (!auth.currentUser || !state.user) {
      throw new Error('Authenticated admin user required.');
    }

    await adminAccessService.repairMyAdminClaims();
    const userDoc = await loadProfileByUid(auth.currentUser.uid);
    if (!userDoc) {
      throw new Error('Account profile not found.');
    }

    const refreshedUser = await attachRuntimeClaims(auth.currentUser, userDoc);
    authStorage.setUser(refreshedUser);
    dispatch({ type: 'LOGIN_SUCCESS', payload: refreshedUser });
    return refreshedUser;
  };

  // Clear Error Function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Set Loading Function
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  // Context Value
  const value: AuthContextType = {
    state,
    login,
    logout,
    register,
    signInWithGoogleFree,
    forgotPassword,
    resetPassword,
    verifyPasswordReset,
    updateUser,
    refreshAdminAccess,
    clearError,
    setLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper Functions

// Validate user data integrity
function validateUser(user: User): boolean {
  if (!user || !user.id || !user.email || !user.role) {
    return false;
  }

  // Check if role is valid
  const validRoles: UserRole[] = ['respondent', 'subscriber', 'admin'];
  if (!validRoles.includes(user.role)) {
    return false;
  }

  // Check if status is valid
  const validStatuses: UserStatus[] = ['active', 'suspended', 'pending', 'draft', 'rejected'];
  if (!validStatuses.includes(user.status)) {
    return false;
  }

  // Check if assigned countries are valid (for subscribers)
  if (user.role === 'subscriber' && user.assignedCountries) {
    const validCountries: CountryCode[] = ['rwanda', 'uganda', 'burundi'];
    if (!user.assignedCountries.every(country => validCountries.includes(country))) {
      return false;
    }
  }

  return true;
}

function buildPasswordResetActionSettings(continuePath?: string) {
  const safeContinuePath = continuePath?.startsWith('/') ? continuePath : '/login';
  const resetReturnUrl = new URL(`${window.location.origin}/reset-password`);
  resetReturnUrl.searchParams.set('returnTo', safeContinuePath);
  return {
    url: resetReturnUrl.toString(),
    handleCodeInApp: false,
  };
}

function getAuthErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as AuthError).code)
    : '';
}

function getLoginErrorMessage(error: unknown): string {
  switch (getAuthErrorCode(error)) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Try again shortly.';
    case 'auth/network-request-failed': {
      const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
      if (host === '127.0.0.1') {
        return 'Firebase sign-in failed from 127.0.0.1. Use localhost for local preview, or add 127.0.0.1 to Firebase Authentication Authorized domains.';
      }
      if (host.includes('--preview-')) {
        return 'Firebase sign-in failed from this preview domain. Add this exact preview hostname to Firebase Authentication Authorized domains, then retry.';
      }
      return 'Firebase sign-in request failed. Check network access and confirm the current hostname is allowed in Firebase Authentication Authorized domains.';
    }
    default:
      return error instanceof Error ? error.message : 'Login failed.';
  }
}

function isPasswordResetNonDisclosureError(error: unknown): boolean {
  return getAuthErrorCode(error) === 'auth/user-not-found';
}

function getPasswordResetRequestMessage(error: unknown): string {
  switch (getAuthErrorCode(error)) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many reset requests. Try again shortly.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return error instanceof Error ? error.message : 'Password reset request failed.';
  }
}

function getPasswordResetConfirmMessage(error: unknown): string {
  switch (getAuthErrorCode(error)) {
    case 'auth/expired-action-code':
    case 'auth/invalid-action-code':
      return 'This reset link is invalid or has expired. Request a new password reset email.';
    case 'auth/weak-password':
      return 'Choose a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return error instanceof Error ? error.message : 'Password reset failed.';
  }
}
