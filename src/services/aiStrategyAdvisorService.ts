import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';

const MAX_RESPONSE_WORDS = 800;
const MONTHLY_QUERY_LIMIT = 100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const AI_STRATEGY_SYSTEM_PROMPT = `You are an AI Strategy Advisor supporting executive leadership of a commercial bank.
You are operating within a single analysis session based on the provided dashboard snapshot.
Deliver structured, executive-ready analysis.
Maximum 800 words.
Use clear section headers.
Focus on business implications, competitive position, risks, and strategic priorities.
Avoid generic commentary.
Maintain a neutral, analytical consulting tone.`;

const REQUIRED_SECTIONS = [
  'Strategic Context',
  'Performance Analysis',
  'Market Position',
  'Brand Strength & Conversion',
  'Customer Advocacy',
  'Business Implications',
  'Risk & Opportunity Zones',
  'Strategic Priorities',
] as const;

export interface StrategyAdvisorPayload {
  country: string;
  period: string;
  filters: Record<string, unknown>;
  metrics: Record<string, unknown>;
  previous_period: Record<string, unknown>;
  competitors: Record<string, unknown>;
  user_query: string;
  last_ai_summary?: string;
}

export interface StrategyAdvisorUsage {
  monthKey: string;
  used: number;
  limit: number;
}

export interface StrategyBriefArchiveEntry {
  userId: string;
  monthKey: string;
  title: string;
  country: string;
  period: string;
  summary: string;
  response: string;
  context: Record<string, unknown>;
  createdAt: string;
}

const monthKey = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const toWordLimitedText = (text: string, maxWords: number): string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}...`;
};

export const compressText = (text: string, maxWords = 140): string => {
  if (!text.trim()) return '';
  return toWordLimitedText(text, maxWords);
};

const normalizeWhitespace = (value: string): string => value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

const ensureRequiredSections = (raw: string): string => {
  const normalized = normalizeWhitespace(raw);
  const lower = normalized.toLowerCase();
  const hasAll = REQUIRED_SECTIONS.every((section) => lower.includes(section.toLowerCase()));
  if (hasAll) return toWordLimitedText(normalized, MAX_RESPONSE_WORDS);

  return toWordLimitedText(
    REQUIRED_SECTIONS.map((section) => `## ${section}\n${section === 'Strategic Priorities' ? normalized : 'Not enough signal from current snapshot to provide a confident section-level readout.'}`).join('\n\n'),
    MAX_RESPONSE_WORDS,
  );
};

const hashString = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash >>> 0).toString(36);
};

const cacheKeyFor = (userId: string, payload: StrategyAdvisorPayload): string => {
  const normalizedPayload = {
    country: payload.country,
    period: payload.period,
    filters: payload.filters,
    metrics: payload.metrics,
    previous_period: payload.previous_period,
    competitors: payload.competitors,
    user_query: payload.user_query.trim().toLowerCase(),
    last_ai_summary: payload.last_ai_summary?.trim().toLowerCase() || '',
  };
  return `${userId}_${hashString(JSON.stringify(normalizedPayload))}`;
};

const usageDocRef = (userId: string, key: string) => doc(db, 'aiStrategyUsage', `${userId}_${key}`);
const cacheDocRef = (cacheKey: string) => doc(db, 'aiStrategyCache', cacheKey);
const userDocRef = (userId: string) => doc(db, 'users', userId);

const localUsageKey = (userId: string, key: string) => `ai_strategy_usage_${userId}_${key}`;
const localCacheKey = (key: string) => `ai_strategy_cache_${key}`;

const getUsageLocal = (userId: string, key: string): StrategyAdvisorUsage => {
  try {
    const raw = localStorage.getItem(localUsageKey(userId, key));
    const used = raw ? Number(JSON.parse(raw)?.used || 0) : 0;
    return { monthKey: key, used: Number.isFinite(used) ? used : 0, limit: MONTHLY_QUERY_LIMIT };
  } catch {
    return { monthKey: key, used: 0, limit: MONTHLY_QUERY_LIMIT };
  }
};

const setUsageLocal = (userId: string, key: string, used: number): void => {
  localStorage.setItem(localUsageKey(userId, key), JSON.stringify({ used, updatedAt: new Date().toISOString() }));
};

const getCacheLocal = (key: string): string | null => {
  try {
    const raw = localStorage.getItem(localCacheKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { response: string; createdAt: string };
    const createdAtMs = new Date(parsed.createdAt).getTime();
    if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > CACHE_TTL_MS) {
      localStorage.removeItem(localCacheKey(key));
      return null;
    }
    return parsed.response;
  } catch {
    return null;
  }
};

const setCacheLocal = (key: string, response: string): void => {
  localStorage.setItem(localCacheKey(key), JSON.stringify({ response, createdAt: new Date().toISOString() }));
};

const callGemini = async (payload: StrategyAdvisorPayload): Promise<string> => {
  const callable = httpsCallable(functions, 'aiStrategyAdvisor');
  try {
    const result = await callable({
      payload,
      systemPrompt: AI_STRATEGY_SYSTEM_PROMPT,
    });
    const responseText = String((result.data as { response?: string })?.response || '').trim();
    if (!responseText) throw new Error('AI strategy advisor returned an empty response.');
    return ensureRequiredSections(responseText);
  } catch (error: unknown) {
    const code = getErrorCode(error);
    const message = getErrorMessage(error);
    if (code.includes('resource-exhausted') || message.includes('RESOURCE_EXHAUSTED') || message.includes('(429)')) {
      throw new Error('AI advisor quota is currently exhausted. Please retry later or upgrade quota.');
    }
    if (code.includes('permission-denied') || code.includes('unauthenticated')) {
      throw new Error('Authentication is required for AI Strategy Advisor.');
    }
    if (code.includes('unavailable')) {
      throw new Error('AI Strategy Advisor service is temporarily unavailable.');
    }
    if (message.includes('404') || message.includes('NOT_FOUND')) {
      throw new Error('AI Strategy Advisor backend is not deployed yet. Deploy Firebase Functions and try again.');
    }
    throw new Error(message);
  }
};

const getErrorCode = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : String(code);
  }
  return '';
};

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : String(message);
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unable to call AI Strategy Advisor backend.';
};

const getCachedResponse = async (key: string): Promise<string | null> => {
  try {
    const snap = await getDoc(cacheDocRef(key));
    if (!snap.exists()) return getCacheLocal(key);
    const data = snap.data() as { response?: string; createdAt?: string };
    const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : NaN;
    if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > CACHE_TTL_MS) {
      await deleteDoc(cacheDocRef(key));
      return getCacheLocal(key);
    }
    return data.response || null;
  } catch {
    return getCacheLocal(key);
  }
};

const setCachedResponse = async (key: string, userId: string, responseText: string): Promise<void> => {
  const payload = {
    userId,
    response: responseText,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  };
  try {
    await setDoc(cacheDocRef(key), payload, { merge: true });
  } catch {
    setCacheLocal(key, responseText);
  }
};

export const aiStrategyAdvisorService = {
  getMonthlyUsage: async (userId: string): Promise<StrategyAdvisorUsage> => {
    const key = monthKey();
    try {
      const userSnap = await getDoc(userDocRef(userId));
      if (userSnap.exists()) {
        const userData = userSnap.data() as { ai_usage_count?: number; ai_usage_reset_date?: string };
        const resetDate = userData.ai_usage_reset_date ? new Date(userData.ai_usage_reset_date) : null;
        const sameMonth =
          resetDate !== null &&
          !Number.isNaN(resetDate.getTime()) &&
          resetDate.getFullYear() === new Date().getFullYear() &&
          resetDate.getMonth() === new Date().getMonth();

        const used = sameMonth ? Number(userData.ai_usage_count || 0) : 0;
        if (!sameMonth) {
          await updateDoc(userDocRef(userId), {
            ai_usage_count: 0,
            ai_usage_reset_date: new Date().toISOString(),
          });
        }

        return {
          monthKey: key,
          used,
          limit: MONTHLY_QUERY_LIMIT,
        };
      }
    } catch {
      // Fall through to legacy counters if user doc access is unavailable.
    }

    try {
      const snap = await getDoc(usageDocRef(userId, key));
      if (!snap.exists()) return getUsageLocal(userId, key);
      const data = snap.data() as { used?: number };
      return {
        monthKey: key,
        used: Number(data.used || 0),
        limit: MONTHLY_QUERY_LIMIT,
      };
    } catch {
      return getUsageLocal(userId, key);
    }
  },

  incrementUsage: async (userId: string): Promise<StrategyAdvisorUsage> => {
    const current = await aiStrategyAdvisorService.getMonthlyUsage(userId);
    const nextUsed = current.used + 1;
    const next = { monthKey: current.monthKey, used: nextUsed, limit: MONTHLY_QUERY_LIMIT };

    try {
      await updateDoc(userDocRef(userId), {
        ai_usage_count: nextUsed,
        ai_usage_reset_date: new Date().toISOString(),
      });
      return next;
    } catch {
      // Fall through to legacy counters if user doc access is unavailable.
    }

    try {
      await setDoc(
        usageDocRef(userId, current.monthKey),
        {
          userId,
          monthKey: current.monthKey,
          used: nextUsed,
          updatedAt: new Date().toISOString(),
          updatedAtServer: serverTimestamp(),
        },
        { merge: true },
      );
    } catch {
      setUsageLocal(userId, current.monthKey, nextUsed);
    }
    return next;
  },

  queryStrategyAdvisor: async (userId: string, payload: StrategyAdvisorPayload): Promise<{ response: string; fromCache: boolean }> => {
    const key = cacheKeyFor(userId, payload);
    const cached = await getCachedResponse(key);
    if (cached) {
      return { response: cached, fromCache: true };
    }

    const responseText = await callGemini(payload);
    await setCachedResponse(key, userId, responseText);
    return { response: responseText, fromCache: false };
  },

  saveExecutiveBrief: async (entry: StrategyBriefArchiveEntry): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'aiStrategyBriefs'), {
        ...entry,
        createdAtServer: serverTimestamp(),
      });
      return docRef.id;
    } catch {
      return `local-${Date.now()}`;
    }
  },

  createPrintableBriefHtml: (entry: StrategyBriefArchiveEntry): string => {
    const safeResponse = entry.response.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${entry.title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f4f6fb; color: #0f172a; }
  .page { max-width: 920px; margin: 24px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .header { padding: 28px; background: #0b1b44; color: #fff; }
  .header h1 { margin: 0 0 6px; font-size: 24px; }
  .meta { font-size: 12px; opacity: 0.9; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .summary { padding: 20px 28px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; font-size: 14px; }
  .content { padding: 24px 28px 32px; line-height: 1.65; font-size: 14px; white-space: pre-wrap; }
  .footer { padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #475569; display: flex; justify-content: space-between; }
  @media print {
    body { background: #fff; }
    .page { border: none; margin: 0; max-width: none; border-radius: 0; }
  }
</style>
</head>
<body>
  <article class="page">
    <header class="header">
      <h1>${entry.title}</h1>
      <div class="meta">
        <div><strong>Country</strong><br/>${entry.country}</div>
        <div><strong>Period</strong><br/>${entry.period}</div>
        <div><strong>Generated</strong><br/>${new Date(entry.createdAt).toLocaleString()}</div>
      </div>
    </header>
    <section class="summary"><strong>Executive Summary:</strong> ${entry.summary}</section>
    <section class="content">${safeResponse}</section>
    <footer class="footer">
      <span>AI Strategy Advisor Brief</span>
      <span>Confidential</span>
    </footer>
  </article>
</body>
</html>`;
  },
};

export const strategyAdvisorLimits = {
  MAX_RESPONSE_WORDS,
  MONTHLY_QUERY_LIMIT,
  MAX_FOLLOW_UPS: 5,
  SESSION_TIMEOUT_MS: 20 * 60 * 1000,
};
