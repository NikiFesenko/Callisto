/**
 * geminiSummary.ts
 *
 * Two capabilities:
 * 1. fetchGeminiSummary  — daily market brief (cached per-day in localStorage)
 * 2. callGeminiChat      — multi-turn financial advisor chat
 */

const CACHE_KEY = 'gemini_daily_brief';
const MODEL = 'gemini-2.0-flash';
const NEWS_RSS_QUERY = 'stock market OR geopolitical OR oil price OR Fed OR war OR sanctions OR tariffs';

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

// ── Helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getApiKey(): string {
  const rawKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  const key = rawKey ? rawKey.trim() : '';
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('VITE_GEMINI_API_KEY not set — add it to your .env file');
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

// ── Fetch headlines ────────────────────────────────────────────────────────

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

// ── Daily brief (structured JSON output) ──────────────────────────────────

async function callGemini(headlines: string[], apiKey: string): Promise<GeminiResult> {
  const prompt = `You are a senior macro analyst. Below are today's top financial and geopolitical news headlines.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Respond with a JSON object (no markdown, no code fences) with exactly this shape:
{
  "summary": "<2-3 sentence plain-English overview of what's moving markets today>",
  "themes": [
    { "label": "<short theme name, max 3 words>", "sentiment": "bullish" | "bearish" | "neutral", "emoji": "<single emoji>" },
    { "label": "...", "sentiment": "...", "emoji": "..." },
    { "label": "...", "sentiment": "...", "emoji": "..." }
  ],
  "topRisk": "<one sentence describing the single biggest market risk today>",
  "generatedAt": "${new Date().toISOString()}"
}`;

  const url = `/api/gemini/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
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
                emoji: { type: 'STRING' }
              },
              required: ['label', 'sentiment', 'emoji']
            }
          },
          topRisk: { type: 'STRING' },
          generatedAt: { type: 'STRING' }
        },
        required: ['summary', 'themes', 'topRisk', 'generatedAt']
      }
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const json = await res.json();
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(text.trim()) as GeminiResult;
}

// ── Multi-turn financial advisor chat ──────────────────────────────────────

const ADVISOR_SYSTEM_INSTRUCTION = `You are Colisto AI, an elite financial advisor and macro strategist embedded in a professional trading terminal. You have deep expertise in:
- Global equity markets, indices, and sector rotation
- Fixed income, rates, and central bank policy
- Commodities, FX, and crypto markets
- Geopolitical risk and its market impact
- Portfolio construction and risk management

Your communication style:
- Concise but substantive — no filler words
- Data-driven — cite specific levels, percentages, or historical parallels when relevant
- Balanced — present bull and bear cases fairly
- Actionable — end with a clear takeaway or watchpoint
- Never give personalized investment advice or guarantee returns; frame all views as analysis

Format your responses in clean plain text. Use short paragraphs. When listing items, use a simple dash (—) as bullet. Keep responses under 200 words unless the question genuinely requires depth.`;

/**
 * Sends a multi-turn conversation to Gemini and returns the model's reply text.
 * @param history  Full conversation history (user + model turns so far)
 * @param userMessage  The new user message to append
 */
export async function callGeminiChat(
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const apiKey = getApiKey();
  const url = `/api/gemini/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  // Inject the system persona as the very first user/model exchange so it
  // is always honoured even if the endpoint ignores system_instruction.
  const systemTurn = [
    { role: 'user',  parts: [{ text: `You are Colisto AI. Instructions: ${ADVISOR_SYSTEM_INSTRUCTION}\n\nAcknowledge with a single word.` }] },
    { role: 'model', parts: [{ text: 'Understood.' }] },
  ];

  // Build the rest of the contents from existing history + new message.
  // Ensure history alternates user/model starting with user.
  const historyContents = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const contents = [
    ...systemTurn,
    ...historyContents,
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const body = {
    contents,
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Try to extract a human-readable message from Gemini's error JSON
    try {
      const errJson = JSON.parse(errText);
      const msg = errJson?.error?.message || errText;
      throw new Error(msg);
    } catch {
      throw new Error(`API error ${res.status}: ${errText.slice(0, 120)}`);
    }
  }

  const json = await res.json();
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Empty response from Gemini — try again');
  return text.trim();
}

// ── Public API ─────────────────────────────────────────────────────────────

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
