import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthAction, User, UserStatus, UserRole, CountryCode } from './types';
import { authStorage } from './utils';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { userService } from '@/services/userService';

// Auth Context Type
interface AuthContextType {
  state: AuthState;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  register: (data: { email: string; password: string; companyName?: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
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

  // Initialize auth state from storage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          authStorage.clear();
          dispatch({ type: 'LOGOUT' });
          return;
        }
        const email = firebaseUser.email || '';
        const userDoc = await userService.getUserByEmail(email);
        if (!userDoc) {
          authStorage.clear();
          dispatch({ type: 'LOGOUT' });
          return;
        }
        authStorage.setUser(userDoc);
        dispatch({ type: 'LOGIN_SUCCESS', payload: userDoc });
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'LOGOUT' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login Function
  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const userDoc = await userService.getUserByEmail(credentials.email);
      if (!userDoc) {
        throw new Error('Account profile not found.');
      }
      const updatedUser = { ...userDoc, lastLogin: new Date().toISOString() };
      authStorage.setUser(updatedUser);
      dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
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

  // Forgot Password Function
  const forgotPassword = async (email: string) => {
    try {
      // Simulate API call
      await mockForgotPassword(email);
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Reset Password Function
  const resetPassword = async (token: string, password: string) => {
    try {
      // Simulate API call
      await mockResetPassword(token, password);
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
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
    forgotPassword,
    resetPassword,
    updateUser,
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

// Mock Authentication Functions (Replace with real API calls)

async function mockForgotPassword(email: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In real app, you'd send email with reset token
  console.log('Password reset email sent to:', email);
}

async function mockResetPassword(token: string, password: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In real app, you'd verify token and update password
  console.log('Password reset successful for token:', token);
}
