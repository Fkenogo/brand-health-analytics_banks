import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { COUNTRY_CHOICES } from '@/constants';
import { validateEmail } from '@/auth/utils';
import { CountryCode } from '@/types';
import { useAuth } from '@/auth/context';

type PublicPlanKind = 'free' | 'standard' | 'premium';

const PLAN_COPY: Record<PublicPlanKind, {
  eyebrow: string;
  title: string;
  description: string;
  submitLabel: string;
  successTitle: string;
  successBody: string;
}> = {
  free: {
    eyebrow: 'Free Access',
    title: 'Start free access',
    description: 'Register your institution for BrandEdge Free and open the first layer of platform visibility.',
    submitLabel: 'Start Free Access',
    successTitle: 'Free access request received.',
    successBody: 'Your registration has been captured. We will confirm the next step for free access by email.',
  },
  standard: {
    eyebrow: 'Standard Access',
    title: 'Request Standard access',
    description: 'Tell us which institution should be provisioned and the markets you need covered. We will route this into the subscriber onboarding workflow.',
    submitLabel: 'Request Standard Access',
    successTitle: 'Standard access request received.',
    successBody: 'Our team will review the request and contact you about provisioning, coverage, and commercial setup.',
  },
  premium: {
    eyebrow: 'Premium Access',
    title: 'Discuss premium access',
    description: 'Share the institution, intended markets, and executive use case so we can scope Premium access and AI support.',
    submitLabel: 'Discuss Premium Access',
    successTitle: 'Premium inquiry received.',
    successBody: 'We will follow up to scope Premium access, AI add-on requirements, and commercial terms.',
  },
};

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogleFree } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedPlan = useMemo<PublicPlanKind>(() => {
    const raw = searchParams.get('plan');
    return raw === 'standard' || raw === 'premium' ? raw : 'free';
  }, [searchParams]);
  const planCopy = PLAN_COPY[selectedPlan];
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [requestedCountry, setRequestedCountry] = useState<CountryCode>('rwanda');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      setSuccess(false);
      return;
    }

    if (!companyName.trim()) {
      setError('Enter the institution name.');
      setSuccess(false);
      return;
    }

    if (!contactName.trim()) {
      setError('Enter the primary contact name.');
      setSuccess(false);
      return;
    }

    setError(null);
    setSuccess(true);
  };

  const onGoogleSignup = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogleFree({
        requestedCountry,
        companyName: companyName.trim() || undefined,
        contactName: contactName.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google signup failed.';
      setError(message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/60 p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{planCopy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black text-white">{planCopy.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{planCopy.description}</p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
            <p className="font-semibold text-white">{planCopy.successTitle}</p>
            <p className="mt-2">{planCopy.successBody}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/demo')}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
              >
                View Sample Insights
              </button>
              <button
                onClick={() => navigate('/login')}
                className="rounded-2xl border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {selectedPlan === 'free' && (
              <>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Country Access</label>
                  <select
                    value={requestedCountry}
                    onChange={(event) => setRequestedCountry(event.target.value as CountryCode)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-cyan-500"
                  >
                    {COUNTRY_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-4 text-sm text-slate-200">
                  Free access gives you a first look at BrandEdge, including the core market view and overview insights for one country.
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignup}
                  disabled={isGoogleSubmitting}
                  className="h-12 w-full rounded-2xl bg-white font-black text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGoogleSubmitting ? 'Connecting Google...' : 'Continue with Google'}
                </button>

                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-500">
                  <div className="h-px flex-1 bg-white/10" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-cyan-500"
                  placeholder="name@bank.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Primary Contact</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-cyan-500"
                  placeholder="Full name"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Institution</label>
              <input
                type="text"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-cyan-500"
                placeholder="Bank name"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-300">
              {selectedPlan === 'free' ? (
                <p>
                  Free access gives you a first look at BrandEdge, including the core market view and overview insights for one country.
                </p>
              ) : (
                <p>
                  Standard and Premium requests are reviewed commercially before dashboard access is provisioned.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="h-12 w-full rounded-2xl bg-cyan-500 font-black text-slate-950 transition hover:bg-cyan-400"
            >
              {planCopy.submitLabel}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <Link to="/" className="underline underline-offset-4 hover:text-white">
                Back to homepage
              </Link>
              <Link to="/login" className="underline underline-offset-4 hover:text-white">
                Returning user? Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;
