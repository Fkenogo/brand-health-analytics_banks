import { UserRole } from './types';

export const getRoleHomePath = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'subscriber':
      return '/dashboard';
    case 'respondent':
    default:
      return '/';
  }
};

export const getRoleEntryPath = (role: UserRole): string => {
  if (role === 'respondent') return '/';
  return '/login';
};
