import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionnaireStore } from '@/utils/questionnaireStore';
import { Question } from '@/types';
import { questionnaireService } from '@/services/questionnaireService';

const AdminQuestionnairesPage: React.FC = () => {
  const navigate = useNavigate();

  const [versions, setVersions] = useState(questionnaireStore.list());
  const [activeId, setActiveId] = useState(versions[0]?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const current = versions.find(v => v.id === activeId);
  const canEdit = current?.status === 'draft' && (current?.usedInWaves?.length || 0) === 0;

  const refresh = React.useCallback(() => {
    const load = async () => {
      try {
        const next = await questionnaireService.list();
        if (next.length === 0) {
          const fallback = questionnaireStore.list();
          await questionnaireService.ensureSeed(fallback);
          setVersions(fallback);
          setActiveId(fallback[0]?.id);
          return;
        }
        setVersions(next);
        if (!next.find(v => v.id === activeId)) {
          setActiveId(next[0]?.id);
        }
      } catch (err) {
        setError('Failed to load questionnaires from Firestore.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateQuestion = (questionId: string, patch: Partial<Question>) => {
    if (!current) return;
    questionnaireService.updateQuestion(current.id, questionId, patch).then(refresh);
  };

  const addQuestion = () => {
    if (!current) return;
    const newQuestion: Question = {
      id: `custom_${Date.now()}`,
      type: 'note',
      section: 'Custom',
      label: { en: 'New question', rw: 'New question', fr: 'New question' },
      description: { en: '', rw: '', fr: '' },
    } as Question;
    questionnaireService.addQuestion(current.id, newQuestion).then(refresh);
  };

  const moveQuestion = (index: number, delta: number) => {
    if (!current) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= current.questions.length) return;
    questionnaireService.moveQuestion(current.id, index, nextIndex).then(refresh);
  };

  const addChoice = (questionId: string) => {
    if (!current) return;
    const question = current.questions.find(q => q.id === questionId);
    if (!question) return;
    const choices = question.choices ? [...question.choices] : [];
    choices.push({
      value: `option_${Date.now()}`,
      label: { en: 'New option', rw: 'New option', fr: 'New option' },
    });
    updateQuestion(questionId, { choices });
  };

  const updateChoice = (questionId: string, index: number, patch: Partial<Question['choices'][number]>) => {
    if (!current) return;
    const question = current.questions.find(q => q.id === questionId);
    if (!question || !question.choices) return;
    const choices = question.choices.map((choice, idx) => (idx === index ? { ...choice, ...patch } : choice));
    updateQuestion(questionId, { choices });
  };

  const removeChoice = (questionId: string, index: number) => {
    if (!current) return;
    const question = current.questions.find(q => q.id === questionId);
    if (!question || !question.choices) return;
    const choices = question.choices.filter((_, idx) => idx !== index);
    updateQuestion(questionId, { choices });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">Questionnaire Management</h1>
            <p className="mt-2 text-sm text-slate-400">Edit surveys, manage logic, and version waves.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
          >
            Back to Admin
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Versions</h2>
              <p className="text-sm text-slate-400">Clone active questionnaires to create a new draft.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!current) return;
                  questionnaireService.createDraftFrom(current.id).then(refresh);
                }}
                className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white"
              >
                Clone to Draft
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          {loading && (
            <p className="mt-4 text-sm text-slate-500">Loading questionnaire versions...</p>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {versions.map(version => (
              <button
                key={version.id}
                onClick={() => setActiveId(version.id)}
                className={`rounded-2xl border px-4 py-3 text-left ${
                  activeId === version.id ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/10 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{version.name}</span>
                  <span
                    className={`text-[10px] uppercase tracking-widest ${
                      version.status === 'active'
                        ? 'text-emerald-300'
                        : version.status === 'draft'
                          ? 'text-amber-300'
                          : 'text-slate-400'
                    }`}
                  >
                    {version.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Created {new Date(version.createdAt).toLocaleDateString()}</p>
                {version.waveTag && (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">{version.waveTag}</p>
                )}
              </button>
            ))}
          </div>
          {current && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {current.status === 'draft' && (
                <button
                  onClick={() => {
                    questionnaireService.setActive(current.id).then(refresh);
                  }}
                  className="rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-emerald-200"
                >
                  Promote Draft to Active
                </button>
              )}
              {current.status !== 'draft' && (
                <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                  Active/archived questionnaires are locked. Clone to draft to edit.
                </span>
              )}
              {(current.usedInWaves?.length || 0) > 0 && (
                <span className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  Locked: used in {current.usedInWaves?.join(', ')}
                </span>
              )}
            </div>
          )}
        </section>

        {current && (
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Wave metadata</h2>
                <p className="text-sm text-slate-400">Tag versions to a wave and track usage history.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={current.waveTag || ''}
                  onChange={(event) => {
                    if (!canEdit) return;
                    questionnaireService.updateVersionMeta(current.id, { waveTag: event.target.value }).then(refresh);
                  }}
                  disabled={!canEdit}
                  placeholder="Wave 2"
                  className="h-10 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-xs text-white disabled:opacity-40"
                />
                <button
                  onClick={() => {
                    const label = current.waveTag?.trim();
                    if (!label) return;
                    const used = Array.from(new Set([...(current.usedInWaves || []), label]));
                    questionnaireService.updateVersionMeta(current.id, { usedInWaves: used }).then(refresh);
                  }}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-200"
                >
                  Mark used
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              {(current.usedInWaves || []).length === 0 && (
                <span className="rounded-full border border-white/10 px-3 py-1">Not used in a wave yet</span>
              )}
              {(current.usedInWaves || []).map((wave) => (
                <span key={wave} className="rounded-full border border-white/10 px-3 py-1">
                  {wave}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Questions ({current.questions.length})</h2>
                <p className="text-sm text-slate-400">Edits apply only to this version.</p>
              </div>
              <button
                onClick={addQuestion}
                disabled={!canEdit}
                className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-200 disabled:opacity-40"
              >
                Add Question
              </button>
            </div>
            <div className="space-y-3">
              {current.questions.map((q, index) => (
                <div key={q.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">{q.section}</p>
                      <p className="text-sm font-semibold text-white">{q.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveQuestion(index, -1)}
                        disabled={!canEdit}
                        className="rounded-xl border border-white/10 px-2 py-1 text-xs text-slate-300 disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveQuestion(index, 1)}
                        disabled={!canEdit}
                        className="rounded-xl border border-white/10 px-2 py-1 text-xs text-slate-300 disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => {
                          questionnaireService.removeQuestion(current.id, q.id).then(refresh);
                        }}
                        disabled={!canEdit}
                        className="rounded-xl border border-rose-500/40 px-2 py-1 text-xs text-rose-200 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      value={q.label?.en || ''}
                      onChange={(event) => updateQuestion(q.id, { label: { ...q.label, en: event.target.value } })}
                      disabled={!canEdit}
                      className="h-10 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-xs text-white"
                      placeholder="Question text (EN)"
                    />
                    <input
                      value={q.description?.en || ''}
                      onChange={(event) => updateQuestion(q.id, { description: { ...q.description, en: event.target.value } })}
                      disabled={!canEdit}
                      className="h-10 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-xs text-white"
                      placeholder="Helper text (EN)"
                    />
                  </div>
                  {Array.isArray(q.choices) && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Answer options</p>
                        <button
                          onClick={() => addChoice(q.id)}
                          disabled={!canEdit}
                          className="rounded-xl border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-300 disabled:opacity-40"
                        >
                          Add option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {q.choices.map((choice, cIndex) => (
                          <div key={`${q.id}-${choice.value}-${cIndex}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] items-center">
                            <input
                              value={choice.label?.en || ''}
                              onChange={(event) =>
                                updateChoice(q.id, cIndex, { label: { ...choice.label, en: event.target.value } })
                              }
                              disabled={!canEdit}
                              className="h-10 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-xs text-white"
                              placeholder="Option label (EN)"
                            />
                            <input
                              value={choice.value}
                              onChange={(event) => updateChoice(q.id, cIndex, { value: event.target.value })}
                              disabled={!canEdit}
                              className="h-10 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-xs text-white"
                              placeholder="Value"
                            />
                            <button
                              onClick={() => removeChoice(q.id, cIndex)}
                              disabled={!canEdit}
                              className="rounded-xl border border-rose-500/40 px-2 py-2 text-xs text-rose-200 disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminQuestionnairesPage;
