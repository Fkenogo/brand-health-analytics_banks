import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '@/auth/context';
import { validateEmail } from '@/auth/utils';

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const returnTo = useMemo(() => {
    const raw = searchParams.get('returnTo');
    return raw && raw.startsWith('/') ? raw : '/login';
  }, [searchParams]);
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email, { continuePath: returnTo });
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset request failed.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/60 p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20">
            <Mail className="text-blue-400" size={24} />
          </div>
          <h1 className="text-2xl font-black text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your account email and we will send a password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
              If an account exists for <span className="font-semibold text-white">{email}</span>, a password reset email has been sent.
            </div>
            <p className="text-sm text-slate-400">
              Open the link in that email to set a new password. If you do not receive it, check spam or request another reset.
            </p>
            <Link
              to={returnTo}
              className="block h-12 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-center text-sm font-black leading-[3rem] text-white transition hover:border-blue-500"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
                placeholder="name@bank.com"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-blue-600 font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
            </button>

            <Link
              to={returnTo}
              className="block text-center text-sm text-slate-400 underline underline-offset-4 hover:text-white"
            >
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
