import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriberReportsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Subscriber Dashboard</p>
            <h1 className="text-3xl font-black">Reports</h1>
            <p className="mt-2 text-sm text-slate-400">Generate and export reports for subscribed countries.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">Subscriber reports scaffold. Hook up report generation next.</p>
        </div>
      </main>
    </div>
  );
};

export default SubscriberReportsPage;
