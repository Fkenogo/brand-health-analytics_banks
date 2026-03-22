import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/auth/context';
import { diagnoseAdminAccessError } from '@/services/adminAccessService';

export const RequireAdminAccess: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, refreshAdminAccess, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldAlert className="mx-auto text-primary" size={36} />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated || !state.user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (state.user.role !== 'admin') {
    logout();
    return <Navigate to="/admin/login" replace />;
  }

  if (!state.user.hasAdminClaim) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-200">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Access Recovery</p>
              <h1 className="mt-2 text-2xl font-black">Repair Admin Access</h1>
              <p className="mt-3 text-sm text-slate-300">
                Your canonical profile is admin, but your current runtime token is missing the admin claim. Repair access to continue.
              </p>
              {error && (
                <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={async () => {
                    setIsRepairing(true);
                    setError(null);
                    try {
                      await refreshAdminAccess();
                    } catch (err) {
                      setError(diagnoseAdminAccessError(err).message);
                    } finally {
                      setIsRepairing(false);
                    }
                  }}
                  disabled={isRepairing}
                  className="rounded-2xl bg-amber-300 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 disabled:opacity-60"
                >
                  {isRepairing ? 'Repairing...' : 'Repair Admin Access'}
                </button>
                <button
                  onClick={() => logout()}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
