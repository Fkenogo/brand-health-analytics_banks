import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context';

const SubscriberPendingPage: React.FC = () => {
  const { logout, state } = useAuth();
  const navigate = useNavigate();
  const isRejected = state.user?.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Subscriber Access</p>
        <h1 className="mt-3 text-3xl font-black">
          {isRejected ? 'Access Rejected' : 'Awaiting Admin Approval'}
        </h1>
        <p className="mt-4 text-sm text-slate-400">
          {isRejected
            ? 'Your subscription request was rejected. Contact the platform administrator if you believe this is a mistake.'
            : 'Your account is pending approval. An admin must activate your subscription before you can access dashboards.'}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="rounded-2xl border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-200 hover:border-blue-500"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriberPendingPage;
