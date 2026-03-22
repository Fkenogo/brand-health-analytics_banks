import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const verifyPasswordResetMock = vi.fn();
const resetPasswordMock = vi.fn();

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    verifyPasswordReset: (...args: unknown[]) => verifyPasswordResetMock(...args),
    resetPassword: (...args: unknown[]) => resetPasswordMock(...args),
  }),
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an invalid-link state when verification fails', async () => {
    verifyPasswordResetMock.mockRejectedValue(new Error('This reset link is invalid or has expired. Request a new password reset email.'));

    const { default: ResetPasswordPage } = await import('@/pages/ResetPasswordPage');

    render(
      <MemoryRouter initialEntries={['/reset-password?oobCode=bad-code']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument());
    expect(screen.getByText(/request a new reset link/i)).toBeInTheDocument();
  });

  it('submits a new password after code verification succeeds', async () => {
    verifyPasswordResetMock.mockResolvedValue('user@example.com');
    resetPasswordMock.mockResolvedValue(undefined);

    const { default: ResetPasswordPage } = await import('@/pages/ResetPasswordPage');

    render(
      <MemoryRouter initialEntries={['/reset-password?oobCode=good-code&continueUrl=http%3A%2F%2Flocalhost%2Flogin']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/resetting password for/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'StrongPass123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => expect(resetPasswordMock).toHaveBeenCalledWith('good-code', 'StrongPass123'));
    expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
  });
});
