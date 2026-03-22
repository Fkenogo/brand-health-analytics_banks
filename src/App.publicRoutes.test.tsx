import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { AppRoutes } from '@/App';

vi.mock('@/auth/context', async () => {
  const actual = await vi.importActual<typeof import('@/auth/context')>('@/auth/context');
  return {
    ...actual,
    useAuth: () => ({
      state: {
        isLoading: false,
        isAuthenticated: false,
        user: null,
      },
    }),
  };
});

const expectFullPublicNav = () => {
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights');
  expect(screen.getByRole('link', { name: 'Methodology' })).toHaveAttribute('href', '/methodology');
  expect(screen.getByRole('link', { name: 'Coverage' })).toHaveAttribute('href', '/coverage');
  expect(screen.getByRole('link', { name: 'Survey' })).toHaveAttribute('href', '/survey');
  expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  expect(
    screen.getAllByRole('link', { name: 'Get Started' }).some((link) => link.getAttribute('href') === '/get-started'),
  ).toBe(true);
};

describe('public marketing routes', () => {
  it('renders the public landing page at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('See where your bank wins — before competitors take your customers.')).toBeInTheDocument();
    expectFullPublicNav();
  });

  it('redirects /insights to the landing-page insights section target', () => {
    render(
      <MemoryRouter initialEntries={['/insights']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Executive Snapshot')).toBeInTheDocument();
    expect(screen.queryByText('How BrandEdge Works')).not.toBeInTheDocument();
    expectFullPublicNav();
  });

  it('renders methodology page at /methodology (not homepage)', () => {
    render(
      <MemoryRouter initialEntries={['/methodology']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('How BrandEdge Works')).toBeInTheDocument();
    expect(screen.queryByText('See where your bank wins — before competitors take your customers.')).not.toBeInTheDocument();
    expectFullPublicNav();
  });

  it('renders coverage page at /coverage (not homepage)', () => {
    render(
      <MemoryRouter initialEntries={['/coverage']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Continuous Banking Intelligence Across East Africa')).toBeInTheDocument();
    expect(screen.queryByText('See where your bank wins — before competitors take your customers.')).not.toBeInTheDocument();
    expectFullPublicNav();
  });

  it('keeps the full public nav on /survey', () => {
    render(
      <MemoryRouter initialEntries={['/survey']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Participate in the National Banking Survey')).toBeInTheDocument();
    expectFullPublicNav();
  });

  it('keeps the full public nav on /login', async () => {
    const { default: Login } = await import('@/pages/Login');

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>,
    );

    expect(screen.getByText('Secure Access')).toBeInTheDocument();
    expectFullPublicNav();
  });
});
