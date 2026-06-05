import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDocMock = vi.fn();
const shouldRedirectAdminToCanonicalHostMock = vi.fn();
const getCanonicalAdminUrlMock = vi.fn();

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

vi.mock('@/utils/adminHost', () => ({
  ADMIN_BOOTSTRAP_TIMEOUT_MS: 6500,
  shouldRedirectAdminToCanonicalHost: (...args: unknown[]) => shouldRedirectAdminToCanonicalHostMock(...args),
  getCanonicalAdminUrl: (...args: unknown[]) => getCanonicalAdminUrlMock(...args),
}));

describe('AdminLogin hosting behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldRedirectAdminToCanonicalHostMock.mockReturnValue(false);
    getCanonicalAdminUrlMock.mockReturnValue('https://www.brandedgeafrica.com/admin/login');
    getDocMock.mockResolvedValue({ exists: () => true });
  });

  it('renders the normal admin login when canonical host redirect is not needed', async () => {
    const { default: AdminLogin } = await import('@/pages/AdminLogin');

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Admin Login')).toBeInTheDocument();
    expect(screen.queryByText(/Admin access has moved/i)).not.toBeInTheDocument();
  }, 10000);

  it('exits the loading state with a canonical-host handoff on Firebase-hosted admin login', async () => {
    shouldRedirectAdminToCanonicalHostMock.mockReturnValue(true);
    const { default: AdminLogin } = await import('@/pages/AdminLogin');

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Admin access has moved')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue to BrandEdge Admin/i })).toHaveAttribute(
      'href',
      'https://www.brandedgeafrica.com/admin/login',
    );
    expect(screen.queryByText('Checking admin setup...')).not.toBeInTheDocument();
  });
});
