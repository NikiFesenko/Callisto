import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { cacheWrap } from '../redis';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = Router();
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// GET /api/news
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  if (!FINNHUB_API_KEY) {
    res.status(500).json({ error: 'Finnhub API key not configured' });
    return;
  }

  try {
    const articles = await cacheWrap('news:crypto', 300, async () => {
      const upstream = await fetch(
        `https://finnhub.io/api/v1/news?category=crypto&token=${FINNHUB_API_KEY}`,
        { headers: { 'User-Agent': 'Colisto/1.0' } }
      );
      if (!upstream.ok) throw new Error(`Finnhub news: ${upstream.status}`);
      const raw: any[] = await upstream.json();
      if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty news response');

      return raw
        .filter((item: any) => item.headline && item.url)
        .slice(0, 15)
        .map((item: any) => ({
          id:          String(item.id ?? Math.random()),
          title:       item.headline ?? '',
          url:         item.url      ?? '#',
          source:      item.source   ?? 'Finnhub',
          publishedAt: item.datetime
            ? new Date(item.datetime * 1000).toISOString()
            : new Date().toISOString(),
          sentiment:   'neutral' as const,
          currencies:  [] as string[],
        }));
    });

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(articles);
  } catch (err: any) {
    console.error('[News proxy]', err.message);
    res.status(502).json({ error: 'News upstream error' });
  }
});

export default router;
