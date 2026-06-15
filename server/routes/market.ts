import { Router, Request, Response } from 'express';
import { cacheWrap } from '../redis';

const router = Router();

const CG_BASE = 'https://api.coingecko.com/api/v3';

// GET /api/market/prices?ids=bitcoin,solana,ethereum
router.get('/prices', async (req: Request, res: Response): Promise<void> => {
  const ids = (req.query.ids as string) || 'bitcoin,solana,ethereum';
  const safeIds = ids.split(',').slice(0, 20).join(',');

  const cacheKey = `market:prices:${safeIds}`;

  try {
    const data = await cacheWrap(cacheKey, 60, async () => {
      const url = `${CG_BASE}/coins/markets?vs_currency=usd&ids=${safeIds}&order=market_cap_desc&sparkline=true&price_change_percentage=7d&precision=2`;
      const upstream = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Colisto/1.0' },
      });
      if (!upstream.ok) throw new Error(`CoinGecko responded with ${upstream.status}`);
      const json = await upstream.json();
      if (!Array.isArray(json) || json.length === 0) throw new Error('Empty market data response');
      return json;
    });

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json(data);
  } catch (err: any) {
    console.error('[Market/prices]', err.message);
    res.status(502).json({ error: 'CoinGecko upstream error' });
  }
});

// GET /api/market/chart?id=bitcoin&days=30
router.get('/chart', async (req: Request, res: Response): Promise<void> => {
  const { id, days = '30' } = req.query as Record<string, string>;

  if (!id) { res.status(400).json({ error: 'id is required' }); return; }
  if (!/^[a-z0-9-]+$/.test(id)) { res.status(400).json({ error: 'Invalid coin id' }); return; }

  const cacheKey = `market:chart:${id}:${days}`;

  try {
    const data = await cacheWrap(cacheKey, 300, async () => {
      const url = `${CG_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}&precision=2`;
      const upstream = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Colisto/1.0' },
      });
      if (!upstream.ok) throw new Error(`CoinGecko chart responded with ${upstream.status}`);
      const json = await upstream.json();
      if (!json.prices) throw new Error('Invalid chart response shape');
      return json;
    });

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(data);
  } catch (err: any) {
    console.error('[Market/chart]', err.message);
    res.status(502).json({ error: 'CoinGecko chart upstream error' });
  }
});

export default router;
