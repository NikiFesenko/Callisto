import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { cacheWrap } from '../redis';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = Router();
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

import https from 'https';
import http from 'http';

// ── Helper: follow a redirect chain server-side and return the final URL ──────
// Google News /rss/articles/CBMi... tokens are opaque IDs — the real URL only
// exists after Google's servers perform the redirect. We resolve it here in
// Node (no browser CORS/cookie restrictions) before sending to the client.
function followRedirect(url: string, maxHops = 4): Promise<string> {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) { resolve(url); return; }
    if (maxHops <= 0) { resolve(url); return; }

    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'HEAD', timeout: 4000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Colisto/1.0)' }
    }, (res) => {
      const loc = res.headers['location'];
      if (loc && (res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400) {
        // Resolve relative redirects
        const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
        // Stop if it redirected back to google or isn't making progress
        if (next === url || next.includes('news.google.com/rss')) { resolve(url); return; }
        followRedirect(next, maxHops - 1).then(resolve);
      } else {
        resolve(url);
      }
      req.destroy();
    });
    req.on('error', () => resolve(url));
    req.on('timeout', () => { req.destroy(); resolve(url); });
    req.end();
  });
}

// ── Helper: map a raw Finnhub news item → our NewsItem shape ─────────────────
async function mapFinnhub(item: any) {
  const rawUrl: string = item.url ?? '';
  const resolvedUrl = rawUrl.includes('news.google.com')
    ? await followRedirect(rawUrl)
    : rawUrl;

  return {
    id:          String(item.id ?? Math.random()),
    title:       item.headline ?? '',
    url:         resolvedUrl,
    source:      item.source   ?? 'Finnhub',
    publishedAt: item.datetime
      ? new Date(item.datetime * 1000).toISOString()
      : new Date().toISOString(),
    summary:     item.summary  ?? '',
    sentiment:   'neutral' as const,
    currencies:  [] as string[],
    impact:      'medium' as const,
  };
}

// ── GET /api/news  — crypto news for dashboard NewsRow ───────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  if (!FINNHUB_API_KEY) { res.status(500).json({ error: 'Finnhub API key not configured' }); return; }
  try {
    const articles = await cacheWrap('news:crypto', 300, async () => {
      const upstream = await fetch(
        `https://finnhub.io/api/v1/news?category=crypto&token=${FINNHUB_API_KEY}`,
        { headers: { 'User-Agent': 'Colisto/1.0' } }
      );
      if (!upstream.ok) throw new Error(`Finnhub news: ${upstream.status}`);
      const raw: any[] = await upstream.json();
      if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty news response');
      return raw.filter((i: any) => i.headline && i.url).slice(0, 15).map(mapFinnhub);
    });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(articles);
  } catch (err: any) {
    console.error('[News proxy]', err.message);
    res.status(502).json({ error: 'News upstream error' });
  }
});

// ── GET /api/news/general — general market news for Markets page widgets ─────
router.get('/general', async (_req: Request, res: Response): Promise<void> => {
  if (!FINNHUB_API_KEY) { res.status(500).json({ error: 'Finnhub API key not configured' }); return; }
  try {
    const articles = await cacheWrap('news:general', 300, async () => {
      const upstream = await fetch(
        `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`,
        { headers: { 'User-Agent': 'Colisto/1.0' } }
      );
      if (!upstream.ok) throw new Error(`Finnhub general news: ${upstream.status}`);
      const raw: any[] = await upstream.json();
      if (!Array.isArray(raw)) throw new Error('Bad response');
      return raw.filter((i: any) => i.headline && i.url).slice(0, 20).map(mapFinnhub);
    });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(articles);
  } catch (err: any) {
    console.error('[News/general]', err.message);
    res.status(502).json({ error: 'Upstream error' });
  }
});

// ── GET /api/news/company?symbol=AAPL — company-specific news ────────────────
router.get('/company', async (req: Request, res: Response): Promise<void> => {
  if (!FINNHUB_API_KEY) { res.status(500).json({ error: 'Finnhub API key not configured' }); return; }
  const symbol = String(req.query.symbol ?? '').toUpperCase();
  if (!symbol) { res.status(400).json({ error: 'symbol query param required' }); return; }

  const to   = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days back
  const fmt  = (d: Date) => d.toISOString().split('T')[0];

  try {
    const articles = await cacheWrap(`news:company:${symbol}`, 300, async () => {
      const upstream = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fmt(from)}&to=${fmt(to)}&token=${FINNHUB_API_KEY}`,
        { headers: { 'User-Agent': 'Colisto/1.0' } }
      );
      if (!upstream.ok) throw new Error(`Finnhub company-news: ${upstream.status}`);
      const raw: any[] = await upstream.json();
      if (!Array.isArray(raw)) throw new Error('Bad response');
      return raw.filter((i: any) => i.headline && i.url).slice(0, 8).map(mapFinnhub);
    });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(articles);
  } catch (err: any) {
    console.error(`[News/company:${symbol}]`, err.message);
    res.status(502).json({ error: 'Upstream error' });
  }
});

export default router;
