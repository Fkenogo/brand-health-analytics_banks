import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context';
import { validateEmail } from '@/auth/utils';
import { userService } from '@/services/userService';
import { Shield } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdminLogin: React.FC = () => {
  const { state, login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (state.isAuthenticated && state.user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [state.isAuthenticated, state.user, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'bootstrap'));
        setAdminExists(snap.exists());
      } catch (err) {
        setAdminExists(false);
      } finally {
        setCheckingAdmins(false);
      }
    };
    load();
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      if (user.role !== 'admin') {
        logout();
        setError('Admin access only.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await userService.createInitialAdmin(result.user.uid, email);
      setAdminExists(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Admin creation failed.';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (checkingAdmins) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-sm text-slate-300">
          Checking admin setup...
        </div>
      </div>
    );
  }

  const showSignup = adminExists === false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/60 p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20">
            <Shield className="text-emerald-400" size={24} />
          </div>
          <h1 className="text-2xl font-black text-white">{showSignup ? 'Admin Signup' : 'Admin Login'}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {showSignup ? 'Create the first admin to unlock the platform.' : 'Restricted to platform administrators only.'}
          </p>
        </div>

        <form onSubmit={showSignup ? onCreateAdmin : onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-emerald-500"
              placeholder="admin@bankinsights.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>
          {showSignup && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={showSignup ? isCreating : isSubmitting}
            className="h-12 w-full rounded-2xl bg-emerald-500 font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showSignup
              ? (isCreating ? 'Creating...' : 'Create Admin')
              : (isSubmitting ? 'Signing in...' : 'Admin Sign In')}
          </button>
        </form>

        {!showSignup && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setAdminExists(false)}
              className="text-xs text-emerald-200 underline"
            >
              No admin exists yet? Create the first admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
