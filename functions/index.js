const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
];

const MAX_RESPONSE_WORDS = 800;

const toWordLimitedText = (text, maxWords) => {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return String(text || '').trim();
  return `${words.slice(0, maxWords).join(' ')}...`;
};

const normalizeWhitespace = (value) => String(value || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

const REQUIRED_SECTIONS = [
  'Strategic Context',
  'Performance Analysis',
  'Market Position',
  'Brand Strength & Conversion',
  'Customer Advocacy',
  'Business Implications',
  'Risk & Opportunity Zones',
  'Strategic Priorities',
];

const ensureRequiredSections = (raw) => {
  const normalized = normalizeWhitespace(raw);
  const lower = normalized.toLowerCase();
  const hasAll = REQUIRED_SECTIONS.every((section) => lower.includes(section.toLowerCase()));
  if (hasAll) return toWordLimitedText(normalized, MAX_RESPONSE_WORDS);

  const fallback = REQUIRED_SECTIONS.map((section) => {
    const body = section === 'Strategic Priorities'
      ? normalized
      : 'Not enough signal from current snapshot to provide a confident section-level readout.';
    return `## ${section}\n${body}`;
  }).join('\n\n');

  return toWordLimitedText(fallback, MAX_RESPONSE_WORDS);
};

const buildPrompt = (payload) => {
  return [
    'Use only this structured dashboard snapshot.',
    'Do not introduce external assumptions or invent data.',
    'No raw table dumps and no technical implementation details.',
    'Return only the requested executive analysis sections in order.',
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n');
};

const parseGeminiText = (result) => {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
};

const callGeminiModel = async ({ apiKey, model, payload, systemPrompt }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(payload) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1800,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Gemini request failed (${response.status}): ${body || 'Unknown error'}`);
    error.statusCode = response.status;
    throw error;
  }

  const result = await response.json();
  const text = parseGeminiText(result);
  if (!text) throw new Error('Gemini returned an empty response.');
  return ensureRequiredSections(text);
};

exports.aiStrategyAdvisor = onCall({
  region: 'us-central1',
  secrets: [GEMINI_API_KEY],
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 60,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required for AI Strategy Advisor.');
  }

  const systemPrompt = String(request.data?.systemPrompt || '').trim();
  const payload = request.data?.payload;
  if (!payload || typeof payload !== 'object') {
    throw new HttpsError('invalid-argument', 'Invalid payload for AI Strategy Advisor.');
  }

  const requiredKeys = ['country', 'period', 'filters', 'metrics', 'previous_period', 'competitors', 'user_query'];
  const missing = requiredKeys.filter((key) => !(key in payload));
  if (missing.length > 0) {
    throw new HttpsError('invalid-argument', `Missing required payload fields: ${missing.join(', ')}`);
  }

  if (!systemPrompt) {
    throw new HttpsError('invalid-argument', 'System prompt is required.');
  }

  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'GEMINI_API_KEY secret is not configured.');
  }

  let lastError = null;
  for (const model of DEFAULT_GEMINI_MODELS) {
    try {
      const response = await callGeminiModel({ apiKey, model, payload, systemPrompt });
      return { response };
    } catch (error) {
      const message = String(error?.message || error);
      if (message.includes('(404)') || message.includes('NOT_FOUND') || message.includes('not supported')) {
        lastError = error;
        continue;
      }
      if (message.includes('(429)') || message.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpsError('resource-exhausted', message);
      }
      throw new HttpsError('internal', message);
    }
  }

  throw new HttpsError('internal', String(lastError?.message || 'No compatible Gemini model found.'));
});
