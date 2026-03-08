import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const onAuthStateChangedMock = vi.fn();
const signInWithEmailAndPasswordMock = vi.fn();
const signOutMock = vi.fn();
const createUserWithEmailAndPasswordMock = vi.fn();

const getUserByIdMock = vi.fn();
const getUserByEmailMock = vi.fn();

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChangedMock(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPasswordMock(...args),
  signOut: (...args: unknown[]) => signOutMock(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => createUserWithEmailAndPasswordMock(...args),
}));

vi.mock('@/services/userService', () => ({
  userService: {
    getUserById: (...args: unknown[]) => getUserByIdMock(...args),
    getUserByEmail: (...args: unknown[]) => getUserByEmailMock(...args),
  },
}));

describe('Auth context UID hydration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('hydrates profile using firebase uid instead of email query', async () => {
    const fakeUser = {
      uid: 'uid-123',
      email: 'subscriber@example.com',
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
    };

    onAuthStateChangedMock.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      void cb(fakeUser);
      return () => {};
    });

    getUserByIdMock.mockResolvedValue({
      id: 'uid-123',
      email: 'subscriber@example.com',
      role: 'subscriber',
      status: 'active',
      createdAt: '2026-03-08T00:00:00.000Z',
    });

    const { AuthProvider, useAuth } = await import('@/auth/context');

    const AuthProbe = () => {
      const { state } = useAuth();
      if (state.isLoading) return <div>loading</div>;
      if (!state.user) return <div>no-user</div>;
      return <div>{state.user.id}</div>;
    };

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('uid-123')).toBeInTheDocument());

    expect(getUserByIdMock).toHaveBeenCalledWith('uid-123');
    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });
});
