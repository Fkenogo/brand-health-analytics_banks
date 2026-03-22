import React, { useMemo, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ChevronRight, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';
import { ProgressBar } from '@/components/survey/ProgressBar';
import { SURVEY_QUESTIONS, UI_STRINGS, COUNTRY_THEMES, getRuntimeSurveyQuestions } from '@/constants';
import { CountryCode, Language, SurveyResponse } from '@/types';
import { getResponses, saveResponse } from '@/utils/storage';
import { responseService } from '@/services/responseService';
import { questionnaireService } from '@/services/questionnaireService';
import { getDeviceFingerprint, respondentPanel, PANEL_CONFIG } from '@/auth/utils';
import { useAuth } from '@/auth/context';
import { hasPermission } from '@/auth/types';
import {
  isQuestionAnswered,
  normalizeResponseForSubmission,
  validateRequiredQuestions,
} from '@/utils/survey/normalization';

type PanelSource = 'survey' | 'external' | 'manual';

const SurveyPage: React.FC = () => {
  const { country, wave } = useParams();
  const deviceId = useMemo(() => getDeviceFingerprint(), [country, wave]);
  const { state: authState } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('survey_lang') as Language) || 'en');
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState(SURVEY_QUESTIONS);
  const [joinPanel, setJoinPanel] = useState(false);
  const [enterRaffle, setEnterRaffle] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionPending, setSubmissionPending] = useState(false);
  const [surveyStartedAtMs, setSurveyStartedAtMs] = useState<number>(() => Date.now());
  const [antiBotTrap, setAntiBotTrap] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [formData, setFormData] = useState<Partial<SurveyResponse>>(() => {
    const valid: CountryCode[] = ['rwanda', 'uganda', 'burundi'];
    const normalized = country?.toLowerCase();
    const pre = valid.find(c => c === normalized || c.startsWith(normalized || ''));
    return {
      response_id: crypto.randomUUID(),
      country: pre,
      selected_country: pre,
    };
  });

  useEffect(() => {
    const valid: CountryCode[] = ['rwanda', 'uganda', 'burundi'];
    const normalized = country?.toLowerCase();
    const pre = valid.find(c => c === normalized || c.startsWith(normalized || ''));
    if (pre) {
      setFormData((prev) => ({
        response_id: crypto.randomUUID(),
        country: pre,
        selected_country: pre,
      }));
      setIsCompleted(false);
      setCurrentStep(0);
      setShowWelcome(true);
      setHasStarted(false);
      setJoinPanel(false);
      setEnterRaffle(false);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubmitted(false);
      setContactError(null);
      setSubmissionError(null);
      setSubmissionPending(false);
      setSurveyStartedAtMs(Date.now());
      setAntiBotTrap('');
      setConsentAccepted(false);
    }
  }, [country]);

  useEffect(() => { localStorage.setItem('survey_lang', lang); }, [lang]);

  const runtimeQuestions = useMemo(() => getRuntimeSurveyQuestions(questions), [questions]);

  const visibleQuestions = useMemo(() => {
    return runtimeQuestions.filter(q => !q.logic || q.logic(formData));
  }, [formData, runtimeQuestions]);

  const currentQuestion = visibleQuestions[currentStep];
  const theme = formData.selected_country ? COUNTRY_THEMES[formData.selected_country as CountryCode] : null;
  const selectedCountry = formData.selected_country as CountryCode | undefined;
  const selectedCountryTheme = selectedCountry ? COUNTRY_THEMES[selectedCountry] : null;
  const isAdminSurveyMode = authState.user?.role === 'admin' && authState.user?.hasAdminClaim === true;

  const hasRecordedResponse = useMemo(() => {
    if (isAdminSurveyMode) return false;
    if (!formData.selected_country) return false;
    return getResponses().some(
      (r) =>
        r.device_id === deviceId &&
        (r.country || r.selected_country) === formData.selected_country &&
        (r._status === 'completed' || r._status === 'terminated')
    );
  }, [deviceId, formData.selected_country, isAdminSurveyMode]);

  const panelStatus = isAdminSurveyMode
    ? { canSubmit: true as const }
    : formData.selected_country
    ? respondentPanel.canSubmitSurvey(deviceId, formData.selected_country)
    : { canSubmit: true };
  
  const canStartSurvey = isAdminSurveyMode || panelStatus.canSubmit || !hasRecordedResponse;
  
  const panelSource = useMemo<PanelSource>(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source');
    if (source === 'external') return 'external';
    if (source === 'manual') return 'manual';
    return 'survey';
  }, []);

  const startSurvey = () => {
    if (!selectedCountry || !consentAccepted) return;
    setIsCompleted(false);
    setCurrentStep(0);
    setSubmissionError(null);
    setSubmissionPending(false);
    setSurveyStartedAtMs(Date.now());
    setAntiBotTrap('');
    setFormData(prev => ({
      response_id: crypto.randomUUID(),
      country: prev.selected_country,
      selected_country: prev.selected_country,
      consent: 'yes',
    }));
    setHasStarted(true);
    setShowWelcome(false);
  };

  useEffect(() => {
    if (visibleQuestions.length === 0) {
      setCurrentStep(0);
      return;
    }

    if (currentStep > visibleQuestions.length - 1) {
      setCurrentStep(Math.max(0, visibleQuestions.length - 1));
    }
  }, [visibleQuestions.length, currentStep]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        if (wave) {
          const version = await questionnaireService.getByWaveTag(`Wave ${wave}`);
          if (version?.questions?.length && isMounted) {
            setQuestions(version.questions);
            return;
          }
        }
        const active = await questionnaireService.getActive();
        if (active?.questions?.length && isMounted) {
          setQuestions(active.questions);
        }
      } catch (err) {
        // fallback to bundled questions
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [wave]);

  const submitSurveyResponse = async (
    status: 'completed' | 'terminated',
    responseId: string,
    options?: { skipRequiredValidation?: boolean },
  ): Promise<void> => {
    if (!formData.selected_country) return;

    if (!options?.skipRequiredValidation) {
      const requiredValidation = validateRequiredQuestions(visibleQuestions, formData);
      if (!requiredValidation.valid) {
        setSubmissionError(`Please complete all required questions before submitting. Missing: ${requiredValidation.missingQuestionIds.join(', ')}`);
        return;
      }
    }

    const normalized = normalizeResponseForSubmission({
      data: formData,
      responseId,
      deviceId,
      language: lang,
      status,
      startedAtMs: surveyStartedAtMs,
    });

    if (!normalized.ok || !normalized.response) {
      setSubmissionError(`Submission failed validation: ${normalized.errors.join(', ')}`);
      return;
    }

    setSubmissionPending(true);
    setSubmissionError(null);

    try {
      await responseService.submitPublicResponse(normalized.response, antiBotTrap);
      saveResponse(normalized.response);
      if (!isAdminSurveyMode) {
        respondentPanel.recordSubmission(deviceId, formData.selected_country);
      }

      setIsCompleted(true);
      if (status === 'completed') {
        confetti({ particleCount: 150, spread: 70 });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not save your response. Please retry.';
      setSubmissionError(message);
    } finally {
      setSubmissionPending(false);
    }
  };

  const handleNext = async () => {
    if (!formData.selected_country) return;
    if (!currentQuestion) return;
    if (submissionPending) return;

    const responseId = formData.response_id || crypto.randomUUID();

    if (currentQuestion?.isTerminationPoint) {
      await submitSurveyResponse('terminated', responseId, { skipRequiredValidation: true });
      return;
    }

    if (currentStep < visibleQuestions.length - 1) {
      setSubmissionError(null);
      setCurrentStep(s => s + 1);
    } else {
      await submitSurveyResponse('completed', responseId);
    }
  };

  const submitFollowUpPreferences = async () => {
    if (!formData.selected_country) return;
    if (contactSubmitted) return;
    if (!joinPanel && !enterRaffle) {
      setContactSubmitted(true);
      setContactError(null);
      return;
    }
    if (!contactName.trim() || (!contactEmail.trim() && !contactPhone.trim())) {
      setContactError('To join panel and/or raffle, provide name and either email or phone.');
      return;
    }
    setContactSubmitting(true);
    setContactError(null);
    try {
      await responseService.submitPublicFollowUpContact({
        responseId: formData.response_id,
        deviceId,
        country: formData.selected_country,
        joinPanel,
        enterRaffle,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        source: panelSource,
        language: lang,
      });
      setContactSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save contact details. Please try again.';
      setContactError(message);
    } finally {
      setContactSubmitting(false);
    }
  };

  const isNextDisabled = submissionPending || Boolean(currentQuestion?.required && !isQuestionAnswered(currentQuestion, formData));

  const formatNextAllowed = (date?: Date) => {
    if (!date) return 'in a few months';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isCompleted && hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
        <div className="glass-card p-10 rounded-[40px] text-center max-w-lg w-full animate-in fade-in zoom-in duration-700">
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-white">{UI_STRINGS.murakoze[lang]}</h1>
          <p className="opacity-60 mb-6 text-slate-300">{UI_STRINGS.successMessage[lang]}</p>
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200 mb-8">
            <Gift size={18} className="text-emerald-400" />
            <span>You earned {PANEL_CONFIG.INCENTIVE_POINTS_PER_SURVEY} points. Enter the raffle and join the panel below.</span>
          </div>
          <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-left space-y-3">
            <p className="text-sm font-semibold text-white">Submit contact details for follow-up and prize draw</p>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={enterRaffle}
                onChange={(e) => {
                  setEnterRaffle(e.target.checked);
                  setContactSubmitted(false);
                  setContactError(null);
                }}
              />
              Option 1: Enter raffle draw
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={joinPanel}
                onChange={(e) => {
                  setJoinPanel(e.target.checked);
                  setContactSubmitted(false);
                  setContactError(null);
                }}
              />
              Option 2: Join respondent panel for follow-up waves
            </label>
            {(joinPanel || enterRaffle) && (
              <div className="grid gap-2">
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Full name"
                  className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white"
                />
                <input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email (optional if phone provided)"
                  className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white"
                />
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone (optional if email provided)"
                  className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white"
                />
              </div>
            )}
            {contactError && <p className="text-xs text-rose-300">{contactError}</p>}
            {contactSubmitted && <p className="text-xs text-emerald-300">Contact details submitted.</p>}
            <button
              onClick={submitFollowUpPreferences}
              disabled={contactSubmitting || contactSubmitted}
              className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {contactSubmitted ? 'Submitted' : contactSubmitting ? 'Submitting...' : 'Submit Contact Details'}
            </button>
          </div>
          <button
            onClick={() => window.location.reload()}
            disabled={(joinPanel || enterRaffle) && !contactSubmitted}
            className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (showWelcome) {
    if (!selectedCountry || !selectedCountryTheme) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a] text-slate-100">
          <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center">
            <h1 className="text-3xl font-black text-white">Choose your country first</h1>
            <p className="mt-4 text-sm text-slate-300">
              This survey intro is country-specific. Return to the survey entry page to choose Rwanda, Uganda, or Burundi before starting.
            </p>
            <Link
              to="/survey"
              className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500"
            >
              Go to Survey Entry
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f172a]">
        <div className="max-w-lg w-full text-center space-y-10 animate-in fade-in zoom-in duration-700">
           <ShieldCheck size={80} className="mx-auto" style={{ color: selectedCountryTheme.primary }} />
           <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: selectedCountryTheme.secondary }}>
                Country Survey
              </p>
              <h1 className="text-4xl lg:text-5xl font-black text-white">
                Banking Feedback {selectedCountryTheme.name}
              </h1>
              <p className="text-slate-400">
                This questionnaire is for respondents in {selectedCountryTheme.name}. Your answers are anonymous, confidential,
                and used only in aggregated market analysis.
              </p>
              {wave && (
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Survey Wave {wave}</p>
              )}
           </div>

           <div className="space-y-6">
              <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 mx-auto w-fit">
                {(['en', 'rw', 'fr'] as Language[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-4 lg:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                  >
                    {l === 'en' ? 'English' : l === 'rw' ? 'Kiny' : 'Français'}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 text-left md:grid-cols-3">
                <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Applies To</p>
                  <p className="mt-2 text-sm font-bold text-white">{selectedCountryTheme.name}</p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Completion Time</p>
                  <p className="mt-2 text-sm font-bold text-white">About 5-8 minutes</p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Why Participate</p>
                  <p className="mt-2 text-sm font-bold text-white">Help improve banking services in {selectedCountryTheme.name}</p>
                </article>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-4 text-left text-sm text-slate-300">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(event) => setConsentAccepted(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    I confirm that I am participating voluntarily, that this survey applies to {selectedCountryTheme.name},
                    and that I understand my answers will be stored anonymously for aggregated research and product insights.
                  </span>
                </label>
              </div>

              {!canStartSurvey && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Thanks for joining the panel! You can return on {formatNextAllowed(panelStatus.nextAllowedDate)}.
                </div>
              )}

              <button
                onClick={startSurvey}
                disabled={!consentAccepted || !canStartSurvey}
                className="w-full h-16 lg:h-20 bg-blue-600 rounded-3xl font-black text-lg lg:text-xl flex items-center justify-center gap-4 hover:scale-105 transition-all text-white shadow-xl shadow-blue-500/30 disabled:opacity-60 disabled:hover:scale-100"
                style={consentAccepted ? { backgroundColor: selectedCountryTheme.primary } : undefined}
              >
                Begin Questionnaire <ChevronRight />
              </button>
              <p className="text-xs text-slate-500">
                Consent is recorded here before the first survey question. You can review the country-specific questionnaire immediately after this step.
              </p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <header className="max-w-2xl mx-auto px-6 py-8 lg:py-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-sm"
            style={theme ? { backgroundColor: theme.primary } : {}}
          >
            {formData.selected_country?.substr(0, 2).toUpperCase() || '?'}
          </div>
          <span className="font-black uppercase tracking-widest text-xs lg:text-sm text-white">Collector</span>
        </div>
        <button
          onClick={() => setLang(l => l === 'en' ? 'rw' : l === 'rw' ? 'fr' : 'en')}
          className="px-4 py-2 glass-card rounded-xl text-[10px] font-black uppercase text-white hover:bg-white/5 transition-all"
        >
          {lang.toUpperCase()}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 mb-6 lg:mb-8">
        <ProgressBar current={currentStep + 1} total={visibleQuestions.length} themeColor={theme?.primary} />
      </div>

      <main className="max-w-2xl mx-auto px-6 pb-36 lg:pb-40">
        {currentQuestion && (
          <div key={`${currentQuestion.id}-${lang}`} className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl lg:text-3xl font-black text-white">{currentQuestion.label[lang]}</h2>
            {currentQuestion.description && <p className="opacity-60 text-slate-300">{currentQuestion.description[lang]}</p>}
            <QuestionRenderer
              question={currentQuestion}
              formData={formData}
              value={formData[currentQuestion.id]}
              lang={lang}
              onChange={(v) => setFormData(prev => ({ ...prev, [currentQuestion.id]: v }))}
              onMetaChange={(patch) => setFormData(prev => ({ ...prev, ...patch }))}
              themeColor={theme?.primary}
            />
          </div>
        )}
        {submissionError && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {submissionError}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 p-6 lg:p-8 glass-card border-t border-white/5">
        <div className="max-w-2xl mx-auto flex gap-4">
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="survey-company-website">Leave this field empty</label>
            <input
              id="survey-company-website"
              tabIndex={-1}
              autoComplete="off"
              value={antiBotTrap}
              onChange={(event) => setAntiBotTrap(event.target.value)}
            />
          </div>
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0 || Boolean(currentQuestion?.isTerminationPoint)}
            className="flex-1 py-4 lg:py-5 rounded-2xl lg:rounded-3xl font-black border border-white/5 disabled:opacity-20 text-white transition-all hover:bg-white/5"
          >
            {UI_STRINGS.back[lang]}
          </button>
          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            className="flex-[2] py-4 lg:py-5 rounded-2xl lg:rounded-3xl bg-blue-600 font-black disabled:opacity-50 text-white transition-all hover:bg-blue-700"
            style={!isNextDisabled && theme ? { backgroundColor: theme.primary } : {}}
          >
            {submissionPending
              ? 'Submitting...'
              : currentQuestion?.isTerminationPoint
                ? 'Finish'
              : currentStep === visibleQuestions.length - 1
                ? UI_STRINGS.complete[lang]
                : UI_STRINGS.continue[lang]}
          </button>
        </div>
        <div className="max-w-2xl mx-auto mt-3 text-[11px] text-slate-500">
          Final submission is protected by automated abuse checks to keep survey results reliable.
        </div>
      </footer>
    </div>
  );
};

export default SurveyPage;
