/**
 * geminiSummary.ts
 *
 * Two capabilities:
 * 1. fetchGeminiSummary  -- daily market brief (cached per-day in localStorage)
 * 2. callGeminiChat      -- multi-turn financial advisor chat
 */

const CACHE_KEY = 'gemini_daily_brief';
const MODEL = 'gemini-2.0-flash';
const NEWS_RSS_QUERY = 'stock market OR geopolitical OR oil price OR Fed OR war OR sanctions OR tariffs';

/**
 * How many recent user+model turn pairs to keep in chat history.
 * Older turns are dropped to cap token cost per request.
 */
const MAX_HISTORY_TURNS = 6;

export interface GeminiResult {
  summary: string;
  themes: { label: string; sentiment: 'bullish' | 'bearish' | 'neutral'; emoji: string }[];
  topRisk: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface CacheEntry {
  date: string;
  data: GeminiResult;
}

// -- Helpers ------------------------------------------------------------------

/** Parse a Gemini HTTP error response into a clean, user-facing message. */
async function parseGeminiError(res: Response): Promise<Error> {
  if (res.status === 429) {
    return new Error(
      "Rate limit reached -- you've hit the free-tier quota. " +
      'Wait a moment and try again, or upgrade your Gemini API plan at ai.google.dev.'
    );
  }
  try {
    const errJson = await res.json();
    const msg = errJson?.error?.message;
    if (msg) return new Error(msg);
  } catch (_) {
    // fall through to status-based message
  }
  return new Error(`Gemini API error (${res.status}) -- please try again.`);
}

/**
 * Fetch wrapper with automatic exponential-backoff retry on 429.
 * Waits 2s -> 4s -> 8s before giving up (3 retries total).
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let delay = 2000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt === maxRetries) return res;
    await new Promise(r => setTimeout(r, delay));
    delay *= 2;
  }
  return fetch(url, init); // unreachable but satisfies TS
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getApiKey(): string {
  const rawKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  const key = rawKey ? rawKey.trim() : '';
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('VITE_GEMINI_API_KEY not set -- add it to your .env file');
  }
  return key;
}

function readCache(): GeminiResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (entry.date === todayStr()) return entry.data;
  } catch (_) {}
  return null;
}

function writeCache(data: GeminiResult) {
  try {
    const entry: CacheEntry = { date: todayStr(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (_) {}
}

// -- Fetch headlines ----------------------------------------------------------

async function fetchHeadlines(): Promise<string[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(NEWS_RSS_QUERY)}&hl=en-US&gl=US&ceid=US:en`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error('RSS fetch failed');
  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('Bad RSS response');
  return data.items.slice(0, 12).map((item: any) => {
    const parts = (item.title || '').split(' - ');
    if (parts.length > 1) parts.pop();
    return parts.join(' - ').trim();
  }).filter(Boolean);
}

// -- Daily brief (structured JSON output) ------------------------------------

async function callGemini(headlines: string[], apiKey: string): Promise<GeminiResult> {
  const prompt = `Below are today's top financial and geopolitical news headlines.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Respond with a JSON object (no markdown, no code fences) with exactly this shape:
{
  "summary": "<2-3 sentence plain-English overview of what's moving markets today>",
  "themes": [
    { "label": "<short theme name, max 3 words>", "sentiment": "bullish|bearish|neutral", "emoji": "<single emoji>" },
    { "label": "...", "sentiment": "...", "emoji": "..." },
    { "label": "...", "sentiment": "...", "emoji": "..." }
  ],
  "topRisk": "<one sentence describing the single biggest market risk today>",
  "generatedAt": "${new Date().toISOString()}"
}`;

  const url = `/api/gemini/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = {
    // system_instruction is billed separately and not counted in per-turn tokens
    system_instruction: {
      parts: [{ text: 'You are a senior macro analyst. Reply only with the requested JSON object, no extra text.' }],
    },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,  // brief JSON never exceeds ~300 tokens
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          summary: { type: 'STRING' },
          themes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                label: { type: 'STRING' },
                sentiment: { type: 'STRING', enum: ['bullish', 'bearish', 'neutral'] },
                emoji: { type: 'STRING' },
              },
              required: ['label', 'sentiment', 'emoji'],
            },
          },
          topRisk: { type: 'STRING' },
          generatedAt: { type: 'STRING' },
        },
        required: ['summary', 'themes', 'topRisk', 'generatedAt'],
      },
    },
  };

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw await parseGeminiError(res);

  const json = await res.json();
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(text.trim()) as GeminiResult;
}

// -- Multi-turn financial advisor chat ----------------------------------------

const ADVISOR_SYSTEM_INSTRUCTION =
  'You are Colisto AI, an elite financial advisor and macro strategist embedded in a professional trading terminal. ' +
  'You have deep expertise in: global equity markets and sector rotation, fixed income and central bank policy, ' +
  'commodities, FX, and crypto markets, geopolitical risk and its market impact, portfolio construction and risk management. ' +
  'Communication style: concise but substantive, data-driven (cite specific levels, percentages, or historical parallels), ' +
  'balanced (present bull and bear cases), actionable (end with a clear takeaway or watchpoint). ' +
  'Never give personalized investment advice or guarantee returns; frame all views as analysis. ' +
  'Format in clean plain text, short paragraphs, dash bullet points. Keep responses under 200 words unless depth is required.';

/**
 * Sends a multi-turn conversation to Gemini and returns the model reply text.
 * @param history      Full conversation history (user + model turns so far)
 * @param userMessage  The new user message to append
 */
export async function callGeminiChat(
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const apiKey = getApiKey();
  const url = `/api/gemini/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  // Trim history to the most recent N turn-pairs to cap token spend.
  // Each "pair" = one user turn + one model turn = 2 messages.
  const trimmedHistory = history.slice(-(MAX_HISTORY_TURNS * 2));

  const contents = [
    ...trimmedHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const body = {
    // system_instruction is sent once and NOT counted in per-turn user tokens,
    // saving ~400 tokens on every single chat request.
    system_instruction: {
      parts: [{ text: ADVISOR_SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 512,  // concise replies; raise if longer answers are needed
    },
  };

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw await parseGeminiError(res);

  const json = await res.json();
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Empty response from Gemini -- try again');
  return text.trim();
}

// -- Public API ---------------------------------------------------------------

export async function fetchGeminiSummary(forceRefresh = false): Promise<GeminiResult> {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }

  const apiKey = getApiKey();
  const headlines = await fetchHeadlines();
  if (!headlines.length) throw new Error('No headlines fetched');

  const result = await callGemini(headlines, apiKey);
  writeCache(result);
  return result;
}
