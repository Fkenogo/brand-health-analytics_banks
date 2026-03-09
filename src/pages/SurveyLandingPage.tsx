import React from 'react';
import { Link } from 'react-router-dom';

const SurveyLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <section className="w-full rounded-3xl border border-white/10 bg-slate-900/60 p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Banking Survey</p>
          <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">
            Participate in the National Banking Survey
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-300 md:text-base">
            Share your banking experience to help improve services across East Africa.
            Your responses are used for aggregated analytics and product insights.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Duration</p>
              <p className="mt-2 text-lg font-bold text-white">5-8 minutes</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Mode</p>
              <p className="mt-2 text-lg font-bold text-white">Anonymous Response</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Coverage</p>
              <p className="mt-2 text-lg font-bold text-white">Rwanda, Uganda, Burundi</p>
            </article>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/survey/start"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500"
            >
              Start Questionnaire
            </Link>
            <Link
              to="/"
              className="rounded-2xl border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-200 hover:border-blue-300"
            >
              Back to BrandEdge
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SurveyLandingPage;
