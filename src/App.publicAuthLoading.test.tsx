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
        isLoading: true,
        isAuthenticated: false,
        user: null,
      },
    }),
  };
});

describe('public homepage auth bootstrap', () => {
  it('renders the public landing page while auth is still loading', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Banking Intelligence Platform')).toBeInTheDocument();
    expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument();
  });
});
