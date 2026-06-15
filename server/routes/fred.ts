import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { cacheWrap } from '../redis';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = Router();
const FRED_API_KEY = process.env.FRED_API_KEY;

// Allowed series IDs — whitelist to prevent proxy abuse
const ALLOWED_SERIES = new Set([
  'CPIAUCSL',   // CPI
  'CPILFESL',   // Core CPI
  'FEDFUNDS',   // Fed Funds Rate
  'M2SL',       // M2 Money Supply
  'GDP',         // GDP
  'UNRATE',     // Unemployment Rate
  'DGS10',      // 10Y Treasury Yield
]);

// GET /api/fred?series_id=CPIAUCSL&observation_start=2020-01-01
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { series_id, observation_start, observation_end, frequency, units } = req.query as Record<string, string>;

  if (!series_id) {
    res.status(400).json({ error: 'series_id is required' });
    return;
  }

  if (!ALLOWED_SERIES.has(series_id)) {
    res.status(400).json({ error: `series_id '${series_id}' not allowed` });
    return;
  }

  if (!FRED_API_KEY) {
    res.status(500).json({ error: 'FRED API key not configured on server' });
    return;
  }

  const params = new URLSearchParams({
    series_id,
    api_key: FRED_API_KEY,
    file_type: 'json',
    sort_order: 'asc',
  });

  if (observation_start) params.set('observation_start', observation_start);
  if (observation_end)   params.set('observation_end',   observation_end);
  if (frequency)         params.set('frequency',         frequency);
  if (units)             params.set('units',             units);

  // Cache key encodes all query dimensions — each unique query is cached separately
  const cacheKey = `fred:${series_id}:${observation_start ?? ''}:${observation_end ?? ''}:${frequency ?? ''}:${units ?? ''}`;

  try {
    const data = await cacheWrap(cacheKey, 3600, async () => {
      const upstream = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?${params}`,
        { headers: { 'User-Agent': 'Colisto/1.0' } }
      );
      if (!upstream.ok) throw new Error(`FRED responded with ${upstream.status}`);
      const json = await upstream.json();
      if (!json.observations) throw new Error('Invalid FRED response — no observations field');
      return json;
    });

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
    res.json(data);
  } catch (err: any) {
    console.error('[FRED proxy]', err.message);
    res.status(502).json({ error: 'FRED upstream error' });
  }
});

export default router;
