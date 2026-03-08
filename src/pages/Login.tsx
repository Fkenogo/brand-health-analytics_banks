import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context';
import { getRoleHomePath } from '@/auth/routing';
import { validateEmail } from '@/auth/utils';
import { Lock } from 'lucide-react';

const Login: React.FC = () => {
  const { state, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      if (state.user.role === 'subscriber' && state.user.status !== 'active') {
        navigate('/dashboard/pending', { replace: true });
      } else {
        navigate(getRoleHomePath(state.user.role), { replace: true });
      }
    }
  }, [state.isAuthenticated, state.user, navigate]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
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
            <Lock className="text-blue-400" size={24} />
          </div>
          <h1 className="text-2xl font-black text-white">Secure Access</h1>
          <p className="mt-2 text-sm text-slate-400">
            Subscriber access only. Accounts require admin approval.
          </p>
        </div>

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

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
              placeholder="••••••••"
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
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          Demo subscriber accounts: analyst@accessbank.com, manager@gtbank.com
        </div>
      </div>
    </div>
  );
};

export default Login;
