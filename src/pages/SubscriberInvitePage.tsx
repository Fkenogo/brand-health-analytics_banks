import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inviteService, PublicInviteView } from '@/services/inviteService';
import { COUNTRY_CHOICES } from '@/constants';
import { CountryCode } from '@/auth/types';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const SubscriberInvitePage: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<PublicInviteView | null>(null);
  const [inviteReason, setInviteReason] = useState<'not_found' | 'expired' | 'used' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setInvite(null);
        setInviteReason('not_found');
        setLoading(false);
        return;
      }

      try {
        const data = await inviteService.getInviteByToken(token);
        if (!data.valid || !data.invite) {
          setInvite(null);
          setInviteReason(data.reason || 'not_found');
        } else {
          setInvite(data.invite);
          setInviteReason(null);
          setCompanyName(data.invite.companyName || '');
          setRequestedCountries(data.invite.countries || []);
        }
      } catch {
        setInvite(null);
        setInviteReason('not_found');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedCountries, setRequestedCountries] = useState<CountryCode[]>([]);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitted' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center">
          <p className="text-sm text-slate-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invite || inviteReason === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center">
          <h1 className="text-2xl font-black">Invite Not Found</h1>
          <p className="mt-3 text-sm text-slate-400">This invitation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (inviteReason === 'expired') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center">
          <h1 className="text-2xl font-black">Invitation Expired</h1>
          <p className="mt-3 text-sm text-slate-400">Ask your administrator for a new invitation link.</p>
        </div>
      </div>
    );
  }

  if (inviteReason === 'used' || status === 'submitted') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center">
          <h1 className="text-2xl font-black">Request Submitted</h1>
          <p className="mt-3 text-sm text-slate-400">
            Thanks for completing onboarding. An admin will review your access and notify you soon.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('idle');
    setErrorMessage(null);

    if (!contactName || !phone || !password) {
      setStatus('error');
      setErrorMessage('Please provide all required details and a password.');
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('Invite token is missing.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, invite.email, password);
      await inviteService.acceptInvite(token, {
        contactName,
        phone,
        requestedCountries,
        companyName,
      });
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      setStatus('submitted');
    } catch (error) {
      try {
        if (auth.currentUser && auth.currentUser.email?.toLowerCase() === invite.email.toLowerCase()) {
          await auth.currentUser.delete();
        }
      } catch {
        // best-effort compensation; backend marks claimsSyncPending for recovery paths
      }
      const message = error instanceof Error ? error.message : 'Failed to complete onboarding.';
      setStatus('error');
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/60 p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Subscriber Onboarding</p>
        <h1 className="mt-3 text-2xl font-black">Complete your access request</h1>
        <p className="mt-3 text-sm text-slate-400">Confirm your details to request dashboard access.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Organization</label>
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Email</label>
            <input
              value={invite.email}
              disabled
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-slate-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Contact name</label>
            <input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Phone</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Requested Countries</label>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_CHOICES.map((choice) => {
                const country = choice.value as CountryCode;
                const checked = requestedCountries.includes(country);
                return (
                  <label
                    key={choice.value}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                      checked ? 'border-blue-500/50 bg-blue-500/10 text-blue-200' : 'border-white/10 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setRequestedCountries((prev) =>
                          event.target.checked ? [...prev, country] : prev.filter((c) => c !== country),
                        );
                      }}
                    />
                    {choice.label.en}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {status === 'error' && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage || 'Failed to complete onboarding.'}
          </div>
        )}

        <button
          type="submit"
          className="mt-6 h-12 w-full rounded-2xl bg-blue-600 font-black text-white transition hover:bg-blue-500"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default SubscriberInvitePage;
