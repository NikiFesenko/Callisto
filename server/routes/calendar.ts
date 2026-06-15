import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { cacheWrap } from '../redis';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = Router();
const FRED_API_KEY = process.env.FRED_API_KEY;

// ── FOMC 2026 Meeting Dates (officially published by the Federal Reserve) ──────
// Source: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
const FOMC_MEETINGS_2026 = [
  '2026-01-28', '2026-03-18', '2026-05-06',
  '2026-06-17', '2026-07-29', '2026-09-16',
  '2026-10-28', '2026-12-09',
];

// ── FRED series metadata for computing next release dates ─────────────────────
const TRACKED_SERIES: Array<{
  id: string;
  name: string;
  category: string;
  importance: 'High' | 'Medium' | 'Low';
  frequencyMonths: number; // release cadence in months
}> = [
  { id: 'CPIAUCSL',  name: 'CPI (Consumer Price Index)',       category: 'Inflation',   importance: 'High',   frequencyMonths: 1 },
  { id: 'CPILFESL',  name: 'Core CPI (ex Food & Energy)',      category: 'Inflation',   importance: 'High',   frequencyMonths: 1 },
  { id: 'UNRATE',    name: 'Unemployment Rate',                 category: 'Employment',  importance: 'High',   frequencyMonths: 1 },
  { id: 'GDP',       name: 'GDP Growth Rate',                   category: 'GDP',         importance: 'High',   frequencyMonths: 3 },
  { id: 'FEDFUNDS',  name: 'Federal Funds Rate',                category: 'Interest Rate',importance: 'High',  frequencyMonths: 1 },
  { id: 'M2SL',      name: 'M2 Money Supply',                   category: 'Monetary',   importance: 'Medium', frequencyMonths: 1 },
  { id: 'DGS10',     name: '10-Year Treasury Yield',            category: 'Bonds',       importance: 'Medium', frequencyMonths: 1 },
];

async function fetchSeriesLastUpdated(seriesId: string): Promise<string | null> {
  if (!FRED_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.stlouisfed.org/fred/series?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json`,
      { headers: { 'User-Agent': 'Colisto/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.seriess?.[0]?.last_updated ?? null;
  } catch {
    return null;
  }
}

function computeNextRelease(lastUpdated: string, frequencyMonths: number): string {
  const date = new Date(lastUpdated);
  date.setMonth(date.getMonth() + frequencyMonths);
  // Round to nearest business day (skip weekends)
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() + 1); // Sunday → Monday
  if (day === 6) date.setDate(date.getDate() + 2); // Saturday → Monday
  return date.toISOString().split('T')[0];
}

// GET /api/calendar
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await cacheWrap('calendar:events', 3600, async () => {
      const today   = new Date().toISOString().split('T')[0];
      const cutoff  = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result: Array<{
        date: string; country: string; category: string; event: string;
        actual: null; previous: number | null; forecast: number | null;
        importance: 'Low' | 'Medium' | 'High';
      }> = [];

      // FOMC dates
      for (const date of FOMC_MEETINGS_2026) {
        if (date >= today && date <= cutoff) {
          result.push({ date, country: 'US', category: 'Interest Rate',
            event: 'FOMC Interest Rate Decision', actual: null, previous: null, forecast: null, importance: 'High' });
        }
      }

      // FRED-derived release dates
      const seriesFetches = TRACKED_SERIES.map(async (s) => {
        const lastUpdated = await fetchSeriesLastUpdated(s.id);
        if (!lastUpdated) return;
        const nextDate = computeNextRelease(lastUpdated, s.frequencyMonths);
        if (nextDate >= today && nextDate <= cutoff) {
          result.push({ date: nextDate, country: 'US', category: s.category,
            event: `${s.name} Release`, actual: null, previous: null, forecast: null, importance: s.importance });
        }
      });

      await Promise.allSettled(seriesFetches);
      result.sort((a, b) => a.date.localeCompare(b.date));
      return result;
    });

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
    res.json(events);
  } catch (err: any) {
    console.error('[Calendar]', err.message);
    res.status(502).json({ error: 'Calendar error' });
  }
});

export default router;
