import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';
import { ProgressBar } from '@/components/survey/ProgressBar';
import { COUNTRY_THEMES, SURVEY_QUESTIONS, UI_STRINGS, getRuntimeSurveyQuestions } from '@/constants';
import { CountryCode, Language, Question, SurveyResponse } from '@/types';
import { useAuth } from '@/auth/context';
import { getDeviceFingerprint, respondentPanel } from '@/auth/utils';
import { questionnaireService } from '@/services/questionnaireService';
import { responseService } from '@/services/responseService';
import { surveyTelemetryService } from '@/services/surveyTelemetryService';
import { getResponses, saveResponse } from '@/utils/storage';
import {
  isQuestionAnswered,
  normalizeResponseForSubmission,
  validateRequiredQuestions,
} from '@/utils/survey/normalization';
import { getSurveyThemeTokens } from '@/utils/surveyTheme';

const ABANDONMENT_TIMEOUT_MS = 30 * 60 * 1000;
const BRANDEDGE_URL = 'https://www.brandedgeafrica.com';
const VALID_COUNTRIES: CountryCode[] = ['rwanda', 'uganda', 'burundi'];

const resolveCountry = (value?: string): CountryCode | undefined => {
  const normalized = value?.toLowerCase();
  return VALID_COUNTRIES.find((code) => code === normalized || code.startsWith(normalized || ''));
};

const SurveyPage: React.FC = () => {
  const { country, wave } = useParams();
  const deviceId = useMemo(() => getDeviceFingerprint(), []);
  const { state: authState } = useAuth();

  const [showWelcome, setShowWelcome] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('survey_lang') as Language) || 'en');
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState(SURVEY_QUESTIONS);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionPending, setSubmissionPending] = useState(false);
  const [surveyStartedAtMs, setSurveyStartedAtMs] = useState<number>(() => Date.now());
  const [antiBotTrap, setAntiBotTrap] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [formData, setFormData] = useState<Partial<SurveyResponse>>(() => {
    const preselectedCountry = resolveCountry(country);
    return {
      response_id: crypto.randomUUID(),
      country: preselectedCountry,
      selected_country: preselectedCountry,
      question_timings: {},
    };
  });

  const formDataRef = useRef(formData);
  const currentQuestionStartedAtRef = useRef<number>(Date.now());
  const consentViewedLoggedRef = useRef(false);
  const lastViewedQuestionKeyRef = useRef<string | null>(null);

  const commitFormData = (next: Partial<SurveyResponse>) => {
    formDataRef.current = next;
    setFormData(next);
  };

  const mergeFormData = (patch: Partial<SurveyResponse>) => {
    commitFormData({
      ...formDataRef.current,
      ...patch,
    });
  };

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const preselectedCountry = resolveCountry(country);
    if (!preselectedCountry) return;

    commitFormData({
      response_id: crypto.randomUUID(),
      country: preselectedCountry,
      selected_country: preselectedCountry,
      question_timings: {},
    });
    setIsCompleted(false);
    setCurrentStep(0);
    setShowWelcome(true);
    setHasStarted(false);
    setSubmissionError(null);
    setSubmissionPending(false);
    setSurveyStartedAtMs(Date.now());
    setAntiBotTrap('');
    setConsentAccepted(false);
    setConsentError(null);
    setSessionId(crypto.randomUUID());
    consentViewedLoggedRef.current = false;
    lastViewedQuestionKeyRef.current = null;
  }, [country]);

  useEffect(() => {
    localStorage.setItem('survey_lang', lang);
  }, [lang]);

  const runtimeQuestions = useMemo(() => getRuntimeSurveyQuestions(questions), [questions]);
  const visibleQuestions = useMemo(
    () => runtimeQuestions.filter((question) => !question.logic || question.logic(formData as SurveyResponse)),
    [formData, runtimeQuestions],
  );
  const currentQuestion = visibleQuestions[currentStep];

  const selectedCountry = formData.selected_country as CountryCode | undefined;
  const selectedCountryTheme = selectedCountry ? COUNTRY_THEMES[selectedCountry] : null;
  const theme = selectedCountryTheme || null;
  const surveyTheme = useMemo(
    () => getSurveyThemeTokens(selectedCountry, selectedCountryTheme),
    [selectedCountry, selectedCountryTheme],
  );
  const isAdminSurveyMode = authState.user?.role === 'admin' && authState.user?.hasAdminClaim === true;

  const hasRecordedResponse = useMemo(() => {
    if (isAdminSurveyMode || !selectedCountry) return false;
    return getResponses().some(
      (response) =>
        response.device_id === deviceId
        && (response.country || response.selected_country) === selectedCountry
        && (response._status === 'completed' || response._status === 'terminated'),
    );
  }, [deviceId, isAdminSurveyMode, selectedCountry]);

  const panelStatus = isAdminSurveyMode
    ? { canSubmit: true as const }
    : selectedCountry
    ? respondentPanel.canSubmitSurvey(deviceId, selectedCountry)
    : { canSubmit: true };

  const canStartSurvey = isAdminSurveyMode || panelStatus.canSubmit || !hasRecordedResponse;

  const trackSurveyEvent = (payload: Parameters<typeof surveyTelemetryService.track>[0]) => {
    void surveyTelemetryService.track(payload);
  };

  const persistActiveSession = useCallback((patch: {
    responseId?: string;
    submitted?: boolean;
    lastQuestionId?: string;
    lastQuestionType?: Question['type'];
  } = {}) => {
    if (!selectedCountry) return;
    surveyTelemetryService.persistActiveSession({
      sessionId,
      country: selectedCountry,
      language: lang,
      responseId: patch.responseId || String(formDataRef.current.response_id || ''),
      submitted: Boolean(patch.submitted),
      lastQuestionId: patch.lastQuestionId,
      lastQuestionType: patch.lastQuestionType,
      lastSeenAt: new Date().toISOString(),
    });
  }, [lang, selectedCountry, sessionId]);

  const formatNextAllowed = (date?: Date) => {
    if (!date) return 'in a few months';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
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
      } catch {
        // fall back to bundled questions
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [wave]);

  useEffect(() => {
    const activeSession = surveyTelemetryService.getActiveSession();
    if (!activeSession || activeSession.submitted) return;

    const lastSeenMs = new Date(activeSession.lastSeenAt).getTime();
    if (!Number.isFinite(lastSeenMs) || Date.now() - lastSeenMs < ABANDONMENT_TIMEOUT_MS) return;

    trackSurveyEvent({
      sessionId: activeSession.sessionId,
      eventType: 'survey_abandoned',
      country: activeSession.country,
      language: activeSession.language,
      responseId: activeSession.responseId,
      questionId: activeSession.lastQuestionId,
      questionType: activeSession.lastQuestionType,
      metadata: {
        proxy: 'local_storage_recovery',
      },
    });
    surveyTelemetryService.clearActiveSession();
  }, []);

  useEffect(() => {
    if (!showWelcome || !selectedCountry || consentViewedLoggedRef.current) return;
    consentViewedLoggedRef.current = true;
    trackSurveyEvent({
      sessionId,
      eventType: 'consent_viewed',
      country: selectedCountry,
      language: lang,
      metadata: {
        wave: wave || null,
      },
    });
  }, [showWelcome, selectedCountry, sessionId, lang, wave]);

  useEffect(() => {
    if (!hasStarted || !currentQuestion || !selectedCountry) return;

    const questionKey = `${sessionId}:${currentQuestion.id}:${currentStep}`;
    if (lastViewedQuestionKeyRef.current === questionKey) return;
    lastViewedQuestionKeyRef.current = questionKey;
    currentQuestionStartedAtRef.current = Date.now();

    persistActiveSession({
      lastQuestionId: currentQuestion.id,
      lastQuestionType: currentQuestion.type,
    });
    trackSurveyEvent({
      sessionId,
      eventType: 'question_viewed',
      country: selectedCountry,
      language: lang,
      responseId: String(formDataRef.current.response_id || ''),
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      metadata: {
        step_index: currentStep,
      },
    });
  }, [hasStarted, currentQuestion, currentStep, selectedCountry, sessionId, lang, persistActiveSession]);

  useEffect(() => {
    if (!hasStarted || isCompleted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      surveyTelemetryService.updateLastSeen({
        lastQuestionId: currentQuestion?.id,
        lastQuestionType: currentQuestion?.type,
      });
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, [hasStarted, isCompleted, currentQuestion]);

  const startSurvey = () => {
    if (!selectedCountry) return;
    if (!consentAccepted) {
      setConsentError('Please confirm your consent to continue.');
      return;
    }
    if (!canStartSurvey) return;

    const responseId = crypto.randomUUID();
    const nextFormData: Partial<SurveyResponse> = {
      response_id: responseId,
      country: selectedCountry,
      selected_country: selectedCountry,
      consent: 'yes',
      question_timings: {},
    };

    commitFormData(nextFormData);
    setIsCompleted(false);
    setCurrentStep(0);
    setSubmissionError(null);
    setSubmissionPending(false);
    setSurveyStartedAtMs(Date.now());
    setAntiBotTrap('');
    setConsentError(null);
    setHasStarted(true);
    setShowWelcome(false);
    currentQuestionStartedAtRef.current = Date.now();

    persistActiveSession({ responseId });
    trackSurveyEvent({
      sessionId,
      eventType: 'survey_session_started',
      country: selectedCountry,
      language: lang,
      responseId,
      metadata: {
        country_route: country || null,
        wave: wave || null,
      },
    });
  };

  const recordQuestionOutcome = (
    question: Question | undefined,
    outcome: 'question_answered' | 'question_skipped',
    snapshot: Partial<SurveyResponse>,
  ) => {
    if (!question || !selectedCountry) return snapshot;

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - currentQuestionStartedAtRef.current) / 1000));
    const nextSnapshot: Partial<SurveyResponse> = {
      ...snapshot,
      question_timings: {
        ...(snapshot.question_timings || {}),
        [question.id]: elapsedSeconds,
      },
    };

    commitFormData(nextSnapshot);
    trackSurveyEvent({
      sessionId,
      eventType: outcome,
      country: selectedCountry,
      language: lang,
      responseId: String(nextSnapshot.response_id || ''),
      questionId: question.id,
      questionType: question.type,
      elapsedSeconds,
      metadata: {
        step_index: currentStep,
      },
    });

    return nextSnapshot;
  };

  const submitSurveyResponse = async (
    status: 'completed' | 'terminated',
    responseId: string,
    options?: { skipRequiredValidation?: boolean; snapshot?: Partial<SurveyResponse> },
  ): Promise<void> => {
    const submissionSnapshot = options?.snapshot || formDataRef.current;
    if (!submissionSnapshot.selected_country) return;

    if (!options?.skipRequiredValidation) {
      const requiredValidation = validateRequiredQuestions(visibleQuestions, submissionSnapshot);
      if (!requiredValidation.valid) {
        setSubmissionError(
          `Please complete all required questions before submitting. Missing: ${requiredValidation.missingQuestionIds.join(', ')}`,
        );
        return;
      }
    }

    const normalized = normalizeResponseForSubmission({
      data: submissionSnapshot,
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
        respondentPanel.recordSubmission(deviceId, submissionSnapshot.selected_country);
      }

      trackSurveyEvent({
        sessionId,
        eventType: 'survey_submitted',
        country: submissionSnapshot.selected_country,
        language: lang,
        responseId,
        metadata: {
          status,
          question_count: visibleQuestions.length,
        },
      });
      surveyTelemetryService.clearActiveSession();

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
    if (!formDataRef.current.selected_country || !currentQuestion || submissionPending) return;

    const responseId = formDataRef.current.response_id || crypto.randomUUID();
    if (currentQuestion.isTerminationPoint) {
      await submitSurveyResponse('terminated', responseId, { skipRequiredValidation: true });
      return;
    }

    let nextSnapshot = formDataRef.current;
    if (currentQuestion.type !== 'note') {
      const answered = isQuestionAnswered(currentQuestion, formDataRef.current);
      nextSnapshot = recordQuestionOutcome(
        currentQuestion,
        answered ? 'question_answered' : 'question_skipped',
        formDataRef.current,
      );
    }

    if (currentStep < visibleQuestions.length - 1) {
      setSubmissionError(null);
      setCurrentStep((step) => step + 1);
      return;
    }

    await submitSurveyResponse('completed', responseId, { snapshot: nextSnapshot });
  };

  const isNextDisabled =
    submissionPending || Boolean(currentQuestion?.required && !isQuestionAnswered(currentQuestion, formData));

  if (isCompleted && hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
        <div className="glass-card p-10 rounded-[40px] text-center max-w-lg w-full animate-in fade-in zoom-in duration-700">
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-white">Thank you for your feedback</h1>
          <p className="text-slate-200 mb-4">
            Your response has been recorded anonymously and will help improve banking services.
          </p>
          <p className="mb-8 text-sm text-slate-400">
            BrandEdge uses survey responses only in aggregated reporting and service improvement analysis.
          </p>
          <a
            href={BRANDEDGE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white transition-all hover:bg-blue-500"
          >
            Visit BrandEdge <ExternalLink size={18} />
          </a>
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
              This survey intro is country-specific. Return to the survey entry page to choose Rwanda, Uganda, or Burundi
              before starting.
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
          <ShieldCheck size={80} className="mx-auto" style={{ color: surveyTheme.primaryFill }} />
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: surveyTheme.emphasisText }}>
              Country Survey
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white">Banking Feedback {selectedCountryTheme.name}</h1>
            <p className="text-slate-400">
              This questionnaire is for respondents in {selectedCountryTheme.name}. Your answers are anonymous, confidential,
              and used only in aggregated market analysis.
            </p>
            {wave && <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Survey Wave {wave}</p>}
          </div>

          <div className="space-y-6">
            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 mx-auto w-fit">
              {(['en', 'rw', 'fr'] as Language[]).map((nextLang) => (
                <button
                  key={nextLang}
                  onClick={() => setLang(nextLang)}
                  className={`px-4 lg:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    lang === nextLang ? '' : 'text-slate-400 hover:text-white'
                  }`}
                  style={lang === nextLang ? { backgroundColor: surveyTheme.primaryFill, color: surveyTheme.primaryText } : undefined}
                >
                  {nextLang === 'en' ? 'English' : nextLang === 'rw' ? 'Kiny' : 'Français'}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-300">Choose your preferred language before starting.</p>

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
                <p className="mt-2 text-sm font-bold text-white">
                  Help improve banking services in {selectedCountryTheme.name}
                </p>
              </article>
            </div>

            <div className="rounded-3xl border border-white/15 bg-slate-900/60 px-5 py-5 text-left text-sm text-slate-200 shadow-lg shadow-slate-950/40">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Please tick the box below to begin.
              </p>
              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/15 bg-slate-950/40 p-4 transition-colors hover:border-white/30">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(event) => {
                    const nextChecked = event.target.checked;
                    setConsentAccepted(nextChecked);
                    if (nextChecked) {
                      setConsentError(null);
                      trackSurveyEvent({
                        sessionId,
                        eventType: 'consent_confirmed',
                        country: selectedCountry,
                        language: lang,
                      });
                    }
                  }}
                  className="mt-0.5 h-6 w-6 min-h-6 min-w-6 rounded border-2 border-slate-400 bg-slate-950 accent-blue-500"
                  style={{ accentColor: surveyTheme.primaryFill }}
                />
                <span className="leading-6">
                  I confirm that I am participating voluntarily, that this survey applies to {selectedCountryTheme.name},
                  and that I understand my answers will be stored anonymously for aggregated research and product insights.
                </span>
              </label>
              {consentError && (
                <p className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {consentError}
                </p>
              )}
            </div>

            {!canStartSurvey && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Thank you for your feedback. You can take this survey again after {formatNextAllowed(panelStatus.nextAllowedDate)}.
              </div>
            )}

            <button
              onClick={startSurvey}
              disabled={!canStartSurvey}
              className="w-full h-16 lg:h-20 rounded-3xl font-black text-lg lg:text-xl flex items-center justify-center gap-4 transition-all shadow-xl disabled:opacity-60 disabled:hover:scale-100 hover:scale-[1.01]"
              style={{ backgroundColor: surveyTheme.primaryFill, color: surveyTheme.primaryText }}
            >
              Begin Questionnaire <ChevronRight />
            </button>
            <p className="text-xs text-slate-500">
              Consent is confirmed on this screen before the first survey question, so the begin button does not feel broken.
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
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm"
            style={{
              backgroundColor: surveyTheme.badgeFill,
              color: surveyTheme.badgeText,
              boxShadow: surveyTheme.variant === 'uganda' ? '0 12px 30px rgba(245, 197, 66, 0.22)' : undefined,
            }}
          >
            {selectedCountry?.slice(0, 2).toUpperCase() || 'BE'}
          </div>
          <span className="font-black uppercase tracking-widest text-xs lg:text-sm text-white">BrandEdge</span>
        </div>
        <button
          onClick={() => setLang((value) => (value === 'en' ? 'rw' : value === 'rw' ? 'fr' : 'en'))}
          className="px-4 py-2 glass-card rounded-xl text-[10px] font-black uppercase text-white hover:bg-white/5 transition-all"
        >
          {lang.toUpperCase()}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 mb-6 lg:mb-8">
        <ProgressBar current={currentStep + 1} total={visibleQuestions.length} themeColor={surveyTheme.primaryFill} />
      </div>

      <main className="max-w-2xl mx-auto px-6 pb-36 lg:pb-40">
        {currentQuestion && (
          <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl lg:text-3xl font-black text-white">{currentQuestion.label[lang]}</h2>
            {currentQuestion.description && <p className="opacity-80 text-slate-300">{currentQuestion.description[lang]}</p>}
            <QuestionRenderer
              key={currentQuestion.id}
              question={currentQuestion}
              formData={formData}
              value={formData[currentQuestion.id]}
              lang={lang}
              onChange={(value) => mergeFormData({ [currentQuestion.id]: value } as Partial<SurveyResponse>)}
              onMetaChange={(patch) => mergeFormData(patch)}
              themeColor={surveyTheme.primaryFill}
            />
          </div>
        )}
        {submissionError && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {submissionError}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 p-6 lg:p-8 glass-card border-t border-white/10">
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
            onClick={() => setCurrentStep((step) => step - 1)}
            disabled={currentStep === 0 || Boolean(currentQuestion?.isTerminationPoint)}
            className="flex-1 py-4 lg:py-5 rounded-2xl lg:rounded-3xl font-black border border-white/15 disabled:opacity-20 text-white transition-all hover:bg-white/5"
          >
            {UI_STRINGS.back[lang]}
          </button>
          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            className="flex-[2] py-4 lg:py-5 rounded-2xl lg:rounded-3xl font-black disabled:opacity-50 transition-all hover:brightness-110"
            style={{
              backgroundColor: isNextDisabled ? '#475569' : surveyTheme.primaryFill,
              color: isNextDisabled ? '#E2E8F0' : surveyTheme.primaryText,
            }}
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
