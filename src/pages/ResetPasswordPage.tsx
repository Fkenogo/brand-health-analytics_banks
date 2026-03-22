import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/auth/context';

const ResetPasswordPage: React.FC = () => {
  const { resetPassword, verifyPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode') || '';
  const returnToParam = searchParams.get('returnTo');
  const continueUrl = searchParams.get('continueUrl');
  const returnTo = useMemo(() => {
    if (returnToParam && returnToParam.startsWith('/')) {
      return returnToParam;
    }
    if (!continueUrl) return '/login';
    try {
      const parsed = new URL(continueUrl);
      return parsed.origin === window.location.origin ? `${parsed.pathname}${parsed.search}` : '/login';
    } catch {
      return continueUrl.startsWith('/') ? continueUrl : '/login';
    }
  }, [continueUrl, returnToParam]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!oobCode) {
        setError('This reset link is invalid or has expired. Request a new password reset email.');
        setLinkInvalid(true);
        setIsVerifying(false);
        return;
      }

      try {
        const email = await verifyPasswordReset(oobCode);
        setResolvedEmail(email);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to verify reset link.';
        setError(message);
        setLinkInvalid(true);
      } finally {
        setIsVerifying(false);
      }
    };

    void verify();
  }, [oobCode, verifyPasswordReset]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(oobCode, password);
      setIsComplete(true);
      setTimeout(() => {
        navigate(`${returnTo}${returnTo.includes('?') ? '&' : '?'}recovery=password-reset-success`, { replace: true });
      }, 1600);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed.';
      setError(message);
      if (message.toLowerCase().includes('invalid or has expired')) {
        setLinkInvalid(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/60 p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20">
            <KeyRound className="text-emerald-400" size={24} />
          </div>
          <h1 className="text-2xl font-black text-white">Choose a new password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Set a new password for your BrandEdge account and return to sign-in.
          </p>
        </div>

        {isVerifying ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-300">
            Verifying reset link...
          </div>
        ) : isComplete ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
              Password updated successfully. Returning to login.
            </div>
            <Link
              to={returnTo}
              className="block h-12 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-center text-sm font-black leading-[3rem] text-white transition hover:border-emerald-500"
            >
              Go to login now
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {resolvedEmail && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                Resetting password for <span className="font-semibold text-white">{resolvedEmail}</span>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            {!linkInvalid && (
              <>
                <div>
                  <label htmlFor="reset-password" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">New Password</label>
                  <input
                    id="reset-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-emerald-500"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="reset-confirm-password" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Confirm Password</label>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-emerald-500"
                    placeholder="Repeat your new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-2xl bg-emerald-500 font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Updating password...' : 'Update password'}
                </button>
              </>
            )}

            <Link
              to={`/forgot-password?returnTo=${encodeURIComponent(returnTo)}`}
              className="block text-center text-sm text-slate-400 underline underline-offset-4 hover:text-white"
            >
              Request a new reset link
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
