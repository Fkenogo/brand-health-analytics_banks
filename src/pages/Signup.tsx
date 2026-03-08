import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('Subscriber onboarding is by invite only. Please use the invitation link sent by the admin.');
    setSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/60 p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-white">Subscriber Signup</h1>
          <p className="mt-2 text-sm text-slate-400">Signup is available via admin invitation only.</p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Signup received. You will receive access after admin approval.
            <button
              onClick={() => navigate('/login')}
              className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
            >
              Go to Login
            </button>
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

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Company name</label>
              <input
                type="text"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
                placeholder="Bank name"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="h-12 w-full rounded-2xl bg-blue-600 font-black text-white transition hover:bg-blue-500"
            >
              Submit for Approval
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;
