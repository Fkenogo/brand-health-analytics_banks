import React, { useEffect, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const onAuthStateChangedMock = vi.fn();
const signInWithPopupMock = vi.fn();
const getIdTokenResultMock = vi.fn();

const createFreeSubscriberSelfServeMock = vi.fn();
const getUserByIdMock = vi.fn();

class GoogleAuthProviderMock {
  setCustomParameters = vi.fn();
}

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChangedMock(...args),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  confirmPasswordReset: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
  GoogleAuthProvider: GoogleAuthProviderMock,
  signInWithPopup: (...args: unknown[]) => signInWithPopupMock(...args),
}));

vi.mock('@/services/userService', () => ({
  userService: {
    getUserById: (...args: unknown[]) => getUserByIdMock(...args),
    createFreeSubscriberSelfServe: (...args: unknown[]) => createFreeSubscriberSelfServeMock(...args),
  },
}));

vi.mock('@/services/adminAccessService', () => ({
  adminAccessService: {
    repairMyAdminClaims: vi.fn(),
  },
}));

describe('Auth Google free signup flow', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    onAuthStateChangedMock.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      void cb(null);
      return () => {};
    });
  });

  it('creates a free subscriber profile after Google popup and hydrates auth state', async () => {
    const fakeUser = {
      uid: 'google-free-1',
      email: 'free@example.com',
      displayName: 'Acme Bank',
      getIdToken: vi.fn().mockResolvedValue('token'),
      getIdTokenResult: getIdTokenResultMock.mockResolvedValue({ claims: { role: 'subscriber', subscriber_state: 'active' } }),
    };

    signInWithPopupMock.mockResolvedValue({ user: fakeUser });
    createFreeSubscriberSelfServeMock.mockResolvedValue({
      id: 'google-free-1',
      email: 'free@example.com',
      role: 'subscriber',
      status: 'active',
      createdAt: '2026-03-13T00:00:00.000Z',
      assignedCountries: ['rwanda'],
      subscription_tier: 'free',
      subscription_addon_ai: false,
    });
    getUserByIdMock.mockResolvedValue({
      id: 'google-free-1',
      email: 'free@example.com',
      role: 'subscriber',
      status: 'active',
      createdAt: '2026-03-13T00:00:00.000Z',
      assignedCountries: ['rwanda'],
      subscription_tier: 'free',
      subscription_addon_ai: false,
      companyName: 'Acme Bank',
    });

    const { AuthProvider, useAuth } = await import('@/auth/context');
    const observed: { role?: string; tier?: string } = {};

    const Probe = () => {
      const { signInWithGoogleFree, state } = useAuth();
      const startedRef = useRef(false);

      useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        void signInWithGoogleFree({ requestedCountry: 'rwanda' });
      }, [signInWithGoogleFree]);

      useEffect(() => {
        if (state.user) {
          observed.role = state.user.role;
          observed.tier = state.user.subscription_tier;
        }
      }, [state.user]);

      return null;
    };

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(createFreeSubscriberSelfServeMock).toHaveBeenCalledWith({
      requestedCountry: 'rwanda',
      companyName: 'Acme Bank',
      contactName: 'Acme Bank',
    }));
    await waitFor(() => expect(observed.role).toBe('subscriber'));
    expect(observed.tier).toBe('free');
  });
});
