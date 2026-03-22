import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { COUNTRY_CHOICES } from '@/constants';
import { PublicSiteHeader } from '@/components/public/PublicSiteHeader';

const SurveyLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Banking Survey</p>
          <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">
            Choose your country to begin
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-300 md:text-base">
            Select the country that applies to you first. We will then show the matching country-specific survey intro,
            confidentiality note, and start screen before the questionnaire begins.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Duration</p>
              <p className="mt-2 text-lg font-bold text-white">5-8 minutes</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Responses</p>
              <p className="mt-2 text-lg font-bold text-white">Anonymous and confidential</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Why it matters</p>
              <p className="mt-2 text-lg font-bold text-white">Helps improve banking services</p>
            </article>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {COUNTRY_CHOICES.map((choice) => (
              <Link
                key={choice.value}
                to={`/survey/start/${choice.value}`}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-blue-400 hover:bg-slate-900"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-blue-300">Country Survey</p>
                <h2 className="mt-3 text-2xl font-black text-white">{choice.label.en}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Open the {choice.label.en} questionnaire intro and continue directly into the correct survey flow.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-200">
                  Continue <ChevronRight size={14} />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
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
