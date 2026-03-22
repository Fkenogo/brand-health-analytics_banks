import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const getDocMock = vi.fn();

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: (...args: unknown[]) => getDocMock(...args),
}));

vi.mock('@/services/userService', () => ({
  userService: {
    createInitialAdmin: vi.fn(),
  },
}));

vi.mock('@/services/adminAccessService', () => ({
  adminAccessService: {
    bootstrapAdminClaims: vi.fn(),
  },
}));

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    state: {
      isAuthenticated: false,
      isLoading: false,
      user: null,
    },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('login recovery banners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocMock.mockResolvedValue({ exists: () => true });
  });

  it('shows the password reset success banner on subscriber login', async () => {
    const { default: Login } = await import('@/pages/Login');

    render(
      <MemoryRouter initialEntries={['/login?recovery=password-reset-success']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Password updated successfully. Sign in with your new password.')).toBeInTheDocument();
  });

  it('shows the password reset success banner on admin login', async () => {
    const { default: AdminLogin } = await import('@/pages/AdminLogin');

    render(
      <MemoryRouter initialEntries={['/admin/login?recovery=password-reset-success']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Password updated successfully. Sign in with your new password.')).toBeInTheDocument();
  });
});
