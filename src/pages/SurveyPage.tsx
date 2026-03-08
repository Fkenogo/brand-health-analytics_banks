import React, { useMemo, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Globe, ChevronRight, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';
import { ProgressBar } from '@/components/survey/ProgressBar';
import { SURVEY_QUESTIONS, UI_STRINGS, COUNTRY_THEMES, COUNTRY_CHOICES } from '@/constants';
import { CountryCode, Language, SurveyResponse } from '@/types';
import { getResponses, saveResponse } from '@/utils/storage';
import { responseService } from '@/services/responseService';
import { questionnaireService } from '@/services/questionnaireService';
import { panelService, PanelSource } from '@/services/panelService';
import { raffleEntryService } from '@/services/raffleEntryService';
import { getDeviceFingerprint, respondentPanel, PANEL_CONFIG } from '@/auth/utils';
import { useAuth } from '@/auth/context';
import { hasPermission } from '@/auth/types';
import {
  isQuestionAnswered,
  normalizeResponseForSubmission,
  validateRequiredQuestions,
} from '@/utils/survey/normalization';

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
  const [formData, setFormData] = useState<Partial<SurveyResponse>>(() => {
    const valid: CountryCode[] = ['rwanda', 'uganda', 'burundi'];
    const normalized = country?.toLowerCase();
    const pre = valid.find(c => c === normalized || c.startsWith(normalized || ''));
    return {
      response_id: crypto.randomUUID(),
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
    }
  }, [country]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('Survey state update:', { 
      currentStep, 
      formDataKeys: Object.keys(formData).length 
    });
  }, [currentStep, formData]);

  useEffect(() => { localStorage.setItem('survey_lang', lang); }, [lang]);

  const visibleQuestions = useMemo(() => {
    return questions.filter(q => !q.logic || q.logic(formData));
  }, [formData, questions]);

  const currentQuestion = visibleQuestions[currentStep];
  const theme = formData.selected_country ? COUNTRY_THEMES[formData.selected_country as CountryCode] : null;

  const hasRecordedResponse = useMemo(() => {
    if (!formData.selected_country) return false;
    return getResponses().some(
      (r) =>
        r.device_id === deviceId &&
        r.selected_country === formData.selected_country &&
        (r._status === 'completed' || r._status === 'terminated')
    );
  }, [deviceId, formData.selected_country]);

  const panelStatus = formData.selected_country
    ? respondentPanel.canSubmitSurvey(deviceId, formData.selected_country)
    : { canSubmit: true };
  
  // Admin bypass: Allow admin users to access survey regardless of panel restrictions
  const isAdmin = authState.user?.role === 'admin';
  const canStartSurvey = isAdmin || panelStatus.canSubmit || !hasRecordedResponse;
  
  const panelSource = useMemo<PanelSource>(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source');
    if (source === 'external') return 'external';
    if (source === 'manual') return 'manual';
    return 'survey';
  }, []);

  const startSurvey = () => {
    setIsCompleted(false);
    setCurrentStep(0);
    setSubmissionError(null);
    setSubmissionPending(false);
    setSurveyStartedAtMs(Date.now());
    setFormData(prev => ({
      response_id: crypto.randomUUID(),
      selected_country: prev.selected_country,
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

  const submitSurveyResponse = async (status: 'completed' | 'terminated', responseId: string): Promise<void> => {
    if (!formData.selected_country) return;

    const requiredValidation = validateRequiredQuestions(visibleQuestions, formData);
    if (!requiredValidation.valid) {
      setSubmissionError(`Please complete all required questions before submitting. Missing: ${requiredValidation.missingQuestionIds.join(', ')}`);
      return;
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
      await responseService.addResponse(normalized.response);
      saveResponse(normalized.response);
      respondentPanel.recordSubmission(deviceId, formData.selected_country);
      panelService.recordParticipation({
        deviceId,
        country: formData.selected_country,
        responseId: normalized.response.response_id,
        source: panelSource,
      }).catch(() => {});

      setIsCompleted(true);
      if (status === 'completed') {
        confetti({ particleCount: 150, spread: 70 });
      }
    } catch (error) {
      setSubmissionError('We could not save your response. Please retry. Your survey is not submitted yet.');
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
      await submitSurveyResponse('terminated', responseId);
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
      const operations: Promise<unknown>[] = [];
      if (joinPanel) {
        operations.push(panelService.savePanelContact({
          deviceId,
          country: formData.selected_country,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          source: panelSource,
        }));
      }
      if (enterRaffle) {
        operations.push(raffleEntryService.createEntry({
          responseId: formData.response_id,
          deviceId,
          country: formData.selected_country,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          source: panelSource,
        }));
      }
      const results = await Promise.allSettled(operations);
      const failed = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failed) {
        const reason = failed.reason as { code?: string; message?: string } | undefined;
        const code = reason?.code || '';
        if (code.includes('permission-denied')) {
          setContactError('Permission denied while saving contacts. Refresh and retry; if it persists, redeploy Firestore rules.');
        } else {
          setContactError(reason?.message || 'Failed to save contact details. Please try again.');
        }
        return;
      }
      setContactSubmitted(true);
    } catch (err) {
      setContactError('Failed to save contact details. Please try again.');
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f172a]">
        <div className="max-w-lg w-full text-center space-y-10 animate-in fade-in zoom-in duration-700">
           <Globe size={80} className="text-blue-500 mx-auto" />
           <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-black text-white">Banking Insights 2026</h1>
              <p className="text-slate-400">Your opinion shapes banking services in your country.</p>
              {wave && (
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Survey Wave {wave}</p>
              )}
           </div>

           {!formData.selected_country && (
             <div className="space-y-4">
               <p className="text-sm text-slate-400">Choose your country to begin.</p>
               <div className="flex flex-wrap justify-center gap-3">
                 {COUNTRY_CHOICES.map(choice => (
                   <button
                     key={choice.value}
                     onClick={() => setFormData(prev => ({ ...prev, selected_country: choice.value as CountryCode }))}
                     className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-blue-500"
                   >
                     {choice.label[lang]}
                   </button>
                 ))}
               </div>
             </div>
           )}

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

              {!canStartSurvey && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Thanks for joining the panel! You can return on {formatNextAllowed(panelStatus.nextAllowedDate)}.
                </div>
              )}

              <button
                onClick={startSurvey}
                disabled={!formData.selected_country || !canStartSurvey}
                className="w-full h-16 lg:h-20 bg-blue-600 rounded-3xl font-black text-lg lg:text-xl flex items-center justify-center gap-4 hover:scale-105 transition-all text-white shadow-xl shadow-blue-500/30 disabled:opacity-60 disabled:hover:scale-100"
              >
                Start Survey <ChevronRight />
              </button>
              <p className="text-xs text-slate-500">
                Earn points for every completed survey and enter monthly raffles.
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
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0}
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
              : currentStep === visibleQuestions.length - 1
                ? UI_STRINGS.complete[lang]
                : UI_STRINGS.continue[lang]}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SurveyPage;
