import { SURVEY_QUESTIONS } from '@/constants';
import { Question } from '@/types';

const STORE_KEY = 'bank_insights_questionnaire_versions';

export type QuestionnaireStatus = 'active' | 'draft' | 'archived';

export interface QuestionnaireVersion {
  id: string;
  name: string;
  status: QuestionnaireStatus;
  createdAt: string;
  waveTag?: string;
  usedInWaves?: string[];
  questions: Question[];
}

const readVersions = (): QuestionnaireVersion[] => {
  const raw = localStorage.getItem(STORE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const writeVersions = (versions: QuestionnaireVersion[]) => {
  localStorage.setItem(STORE_KEY, JSON.stringify(versions));
};

const seedVersions = (): QuestionnaireVersion[] => {
  const versions = readVersions();
  if (versions.length > 0) return versions;
  const seed: QuestionnaireVersion = {
    id: 'version-1',
    name: 'Wave 1 (Active)',
    status: 'active',
    createdAt: new Date().toISOString(),
    waveTag: 'Wave 1',
    usedInWaves: [],
    questions: SURVEY_QUESTIONS,
  };
  writeVersions([seed]);
  return [seed];
};

export const questionnaireStore = {
  list: (): QuestionnaireVersion[] => seedVersions(),
  get: (id: string): QuestionnaireVersion | undefined => seedVersions().find(v => v.id === id),
  createDraftFrom: (id: string): QuestionnaireVersion | null => {
    const versions = seedVersions();
    const base = versions.find(v => v.id === id);
    if (!base) return null;
    const draft: QuestionnaireVersion = {
      ...base,
      id: `version-${Date.now()}`,
      name: `${base.name.replace('(Active)', '').trim()} Draft`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      questions: JSON.parse(JSON.stringify(base.questions)),
    };
    writeVersions([draft, ...versions]);
    return draft;
  },
  setActive: (id: string) => {
    const versions = seedVersions();
    const next = versions.map(v => {
      if (v.id === id) return { ...v, status: 'active', name: v.name.replace('(Draft)', '').trim() };
      if (v.status === 'active') return { ...v, status: 'archived' };
      return v;
    });
    writeVersions(next);
  },
  updateQuestion: (versionId: string, questionId: string, patch: Partial<Question>) => {
    const versions = seedVersions();
    const next = versions.map(version => {
      if (version.id !== versionId) return version;
      if (version.status !== 'draft') return version;
      const questions = version.questions.map(q => (q.id === questionId ? { ...q, ...patch } : q));
      return { ...version, questions };
    });
    writeVersions(next);
  },
  addQuestion: (versionId: string, question: Question) => {
    const versions = seedVersions();
    const next = versions.map(version => {
      if (version.id !== versionId) return version;
      if (version.status !== 'draft') return version;
      return { ...version, questions: [...version.questions, question] };
    });
    writeVersions(next);
  },
  removeQuestion: (versionId: string, questionId: string) => {
    const versions = seedVersions();
    const next = versions.map(version => {
      if (version.id !== versionId) return version;
      if (version.status !== 'draft') return version;
      return { ...version, questions: version.questions.filter(q => q.id !== questionId) };
    });
    writeVersions(next);
  },
  moveQuestion: (versionId: string, fromIndex: number, toIndex: number) => {
    const versions = seedVersions();
    const next = versions.map(version => {
      if (version.id !== versionId) return version;
      if (version.status !== 'draft') return version;
      const questions = [...version.questions];
      const [item] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, item);
      return { ...version, questions };
    });
    writeVersions(next);
  },
};
