import React, { useEffect, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const onAuthStateChangedMock = vi.fn();
const sendPasswordResetEmailMock = vi.fn();
const confirmPasswordResetMock = vi.fn();
const verifyPasswordResetCodeMock = vi.fn();

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChangedMock(...args),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmailMock(...args),
  confirmPasswordReset: (...args: unknown[]) => confirmPasswordResetMock(...args),
  verifyPasswordResetCode: (...args: unknown[]) => verifyPasswordResetCodeMock(...args),
}));

vi.mock('@/services/userService', () => ({
  userService: {
    getUserById: vi.fn(),
  },
}));

vi.mock('@/services/adminAccessService', () => ({
  adminAccessService: {
    repairMyAdminClaims: vi.fn(),
  },
}));

describe('Auth password reset flow', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    onAuthStateChangedMock.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      void cb(null);
      return () => {};
    });
  });

  it('sends a real Firebase password reset email with a return path', async () => {
    sendPasswordResetEmailMock.mockResolvedValue(undefined);
    let caughtError: unknown;

    const { AuthProvider, useAuth } = await import('@/auth/context');

    const Probe = () => {
      const { forgotPassword } = useAuth();
      const startedRef = useRef(false);
      useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        void forgotPassword('user@example.com', { continuePath: '/admin/login' }).catch((error) => {
          caughtError = error;
        });
      }, [forgotPassword]);
      return null;
    };

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
        {},
        'user@example.com',
        {
          url: `${window.location.origin}/reset-password?returnTo=%2Fadmin%2Flogin`,
          handleCodeInApp: false,
        },
      ),
    );

    expect(caughtError).toBeUndefined();
  });

  it('does not leak account existence on password reset request', async () => {
    sendPasswordResetEmailMock.mockRejectedValue({ code: 'auth/user-not-found' });
    let caughtError: unknown;

    const { AuthProvider, useAuth } = await import('@/auth/context');

    const Probe = () => {
      const { forgotPassword } = useAuth();
      const startedRef = useRef(false);
      useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        void forgotPassword('missing@example.com').catch((error) => {
          caughtError = error;
        });
      }, [forgotPassword]);
      return null;
    };

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1));
    expect(caughtError).toBeUndefined();
  });

  it('verifies and confirms a reset code through Firebase', async () => {
    verifyPasswordResetCodeMock.mockResolvedValue('user@example.com');
    confirmPasswordResetMock.mockResolvedValue(undefined);

    const { AuthProvider, useAuth } = await import('@/auth/context');
    const observed: { email?: string } = {};

    const Probe = () => {
      const { verifyPasswordReset, resetPassword } = useAuth();
      const startedRef = useRef(false);
      useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        void (async () => {
          observed.email = await verifyPasswordReset('code-123');
          await resetPassword('code-123', 'StrongPass123');
        })();
      }, [resetPassword, verifyPasswordReset]);
      return null;
    };

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(verifyPasswordResetCodeMock).toHaveBeenCalledWith({}, 'code-123'));
    await waitFor(() => expect(confirmPasswordResetMock).toHaveBeenCalledWith({}, 'code-123', 'StrongPass123'));
    expect(observed.email).toBe('user@example.com');
  });
});
