/**
 * useGeminiSummary
 * Fetches top financial/geopolitical news headlines then asks Gemini
 * to summarize them into a concise daily market brief.
 *
 * Results are cached in localStorage keyed by today's date so
 * Gemini is only called once per day (or on explicit refresh).
 */

const CACHE_KEY = 'gemini_daily_brief';
const MODEL = 'gemini-3.5-flash'; // Works on v1 endpoint
const NEWS_RSS_QUERY = 'stock market OR geopolitical OR oil price OR Fed OR war OR sanctions OR tariffs';

interface GeminiResult {
  summary: string;           // 2–3 sentence market overview
  themes: { label: string; sentiment: 'bullish' | 'bearish' | 'neutral'; emoji: string }[];
  topRisk: string;           // single biggest macro risk today
  generatedAt: string;       // ISO timestamp
}

interface CacheEntry {
  date: string;              // YYYY-MM-DD
  data: GeminiResult;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
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

// ── Fetch headlines from Google News RSS via rss2json ──────────────────────

async function fetchHeadlines(): Promise<string[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(NEWS_RSS_QUERY)}&hl=en-US&gl=US&ceid=US:en`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error('RSS fetch failed');
  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('Bad RSS response');
  return data.items.slice(0, 12).map((item: any) => {
    const parts = (item.title || '').split(' - ');
    if (parts.length > 1) parts.pop(); // strip source
    return parts.join(' - ').trim();
  }).filter(Boolean);
}

// ── Call Gemini via Vite proxy ─────────────────────────────────────────────

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

  // Parse text directly as it is guaranteed to be well-formed JSON by the schema
  return JSON.parse(text.trim()) as GeminiResult;
}

// ── Public hook ────────────────────────────────────────────────────────────

export async function fetchGeminiSummary(forceRefresh = false): Promise<GeminiResult> {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }

  const rawKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  const apiKey = rawKey ? rawKey.trim() : '';
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('VITE_GEMINI_API_KEY not set — add it to your .env file');
  }

  const headlines = await fetchHeadlines();
  if (!headlines.length) throw new Error('No headlines fetched');

  const result = await callGemini(headlines, apiKey);
  writeCache(result);
  return result;
}

export type { GeminiResult };
