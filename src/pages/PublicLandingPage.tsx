import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Gift, Sparkles } from 'lucide-react';

const PublicLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
              <Sparkles size={14} className="text-emerald-400" />
              Banking Insights 2026
            </div>
            <h1 className="text-4xl lg:text-6xl font-black leading-tight">
              Your opinion shapes how banks serve your country.
            </h1>
            <p className="text-lg text-slate-300">
              Join the official banking service tracker. Share what you love, what you avoid, and what would win your loyalty.
              This survey takes just a few minutes — and every voice counts.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/survey/rwanda')}
                className="inline-flex items-center gap-3 rounded-3xl bg-blue-600 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-500/30 hover:bg-blue-500"
              >
                Start the survey
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-emerald-400" />
                Earn points + raffle entries
              </div>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-blue-400" />
                Only one survey every 3 months
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl">
            <h2 className="text-xl font-bold">Why participate?</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-300">
              <li>• Your feedback drives better banking experiences.</li>
              <li>• Influence product design, fees, and service quality.</li>
              <li>• Get invited back as part of the national panel.</li>
            </ul>
            <div className="mt-8 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5">
              <p className="text-sm text-emerald-100">
                Quick. Anonymous. Impactful. Start now and see how your perspective improves banking in your country.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLandingPage;
