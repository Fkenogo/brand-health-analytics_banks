import { User } from './types';

// Storage keys
const STORAGE_KEYS = {
  USER: 'bank_insights_user',
  TOKEN: 'bank_insights_token',
};

// Auth Storage Utilities
export const authStorage = {
  // Store user data
  setUser: (user: User): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  },

  // Get user data
  getUser: (): User | null => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  },

  // Clear all auth data
  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  },

  // Check if user is stored
  hasUser: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEYS.USER);
  },
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Device fingerprinting for respondent tracking
export const getDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('BankInsights', 10, 10);
  const canvasData = canvas.toDataURL();

  const webglCanvas = document.createElement('canvas');
  const gl = webglCanvas.getContext('webgl') as WebGLRenderingContext | null;
  let webglData = '';
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      webglData = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
    }
  }

  const fingerprintData = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    colorDepth: window.screen.colorDepth,
    resolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionStorage: !!window.sessionStorage,
    localStorage: !!window.localStorage,
    cpuClass: (navigator as Navigator & { cpuClass?: string }).cpuClass,
    platform: navigator.platform,
    doNotTrack: (navigator as Navigator & { doNotTrack?: string }).doNotTrack,
    canvas: canvasData,
    webgl: webglData,
  };

  // Simple hash function to create fingerprint
  const fingerprintString = JSON.stringify(fingerprintData);
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
};

// Respondent panel utilities
export const PANEL_CONFIG = {
  COOLDOWN_DAYS: 90, // 3 months
  INCENTIVE_POINTS_PER_SURVEY: 10,
  MAX_POINTS_PER_MONTH: 100,
};

export const respondentPanel = {
  // Check if respondent can submit survey
  canSubmitSurvey: (deviceId: string, country: string): { canSubmit: boolean; nextAllowedDate?: Date; daysRemaining?: number } => {
    try {
      const panelData = localStorage.getItem(`panel_${deviceId}_${country}`);
      if (!panelData) {
        return { canSubmit: true };
      }

      const lastSubmission = JSON.parse(panelData);
      const now = new Date();
      const lastDate = new Date(lastSubmission.date);
      const diffTime = now.getTime() - lastDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= PANEL_CONFIG.COOLDOWN_DAYS) {
        return { canSubmit: true };
      }

      const nextAllowedDate = new Date(lastDate.getTime() + (PANEL_CONFIG.COOLDOWN_DAYS * 24 * 60 * 60 * 1000));
      const daysRemaining = Math.ceil((nextAllowedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        canSubmit: false,
        nextAllowedDate,
        daysRemaining,
      };
    } catch (error) {
      console.error('Error checking panel status:', error);
      return { canSubmit: false };
    }
  },

  // Record survey submission
  recordSubmission: (deviceId: string, country: string): void => {
    try {
      const submissionData = {
        date: new Date().toISOString(),
        country,
        incentivesEarned: PANEL_CONFIG.INCENTIVE_POINTS_PER_SURVEY,
      };

      localStorage.setItem(`panel_${deviceId}_${country}`, JSON.stringify(submissionData));
    } catch (error) {
      console.error('Error recording submission:', error);
    }
  },

  // Get panel status
  getPanelStatus: (deviceId: string, country: string): { lastSubmission?: Date; incentivesEarned?: number; canSubmit?: boolean } => {
    try {
      const panelData = localStorage.getItem(`panel_${deviceId}_${country}`);
      if (!panelData) {
        return { canSubmit: true };
      }

      const data = JSON.parse(panelData);
      return {
        lastSubmission: new Date(data.date),
        incentivesEarned: data.incentivesEarned || 0,
        canSubmit: respondentPanel.canSubmitSurvey(deviceId, country).canSubmit,
      };
    } catch (error) {
      console.error('Error getting panel status:', error);
      return { canSubmit: false };
    }
  },

  // Get total incentives across all countries
  getTotalIncentives: (deviceId: string): number => {
    try {
      let total = 0;
      const countries = ['rwanda', 'uganda', 'burundi'];
      
      countries.forEach(country => {
        const panelData = localStorage.getItem(`panel_${deviceId}_${country}`);
        if (panelData) {
          const data = JSON.parse(panelData);
          total += data.incentivesEarned || 0;
        }
      });

      return total;
    } catch (error) {
      console.error('Error calculating total incentives:', error);
      return 0;
    }
  },
};

// Security utilities
export const security = {
  // Generate secure random token
  generateToken: (length: number = 32): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },

  // Check if password is common (basic check)
  isCommonPassword: (password: string): boolean => {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', 'dragon', 'master'
    ];
    return commonPasswords.includes(password.toLowerCase());
  },

  // Sanitize input to prevent XSS
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  },
};