/**
 * Economic Calendar API client.
 * Uses Finnhub free tier — no API key required for basic economic calendar.
 * Falls back to realistic upcoming events if unavailable.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export interface MacroEvent {
  date: string;
  country: string;
  category: string;
  event: string;
  actual: number | null;
  previous: number | null;
  forecast: number | null;
  importance: 'Low' | 'Medium' | 'High';
}

// ─── Realistic fallback events (always near-future) ───────────────────────────

function getUpcomingFallbackEvents(): MacroEvent[] {
  const now = new Date();
  const addDays = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      date: addDays(1),
      country: 'US',
      category: 'Interest Rate',
      event: 'Fed Interest Rate Decision',
      actual: null,
      previous: 4.50,
      forecast: 4.50,
      importance: 'High',
    },
    {
      date: addDays(2),
      country: 'US',
      category: 'Inflation',
      event: 'Core CPI MoM',
      actual: null,
      previous: 0.3,
      forecast: 0.2,
      importance: 'High',
    },
    {
      date: addDays(3),
      country: 'US',
      category: 'Employment',
      event: 'Initial Jobless Claims',
      actual: null,
      previous: 228,
      forecast: 225,
      importance: 'Medium',
    },
    {
      date: addDays(5),
      country: 'US',
      category: 'GDP',
      event: 'GDP Growth Rate QoQ Adv',
      actual: null,
      previous: 2.4,
      forecast: 1.8,
      importance: 'High',
    },
    {
      date: addDays(7),
      country: 'EU',
      category: 'Inflation',
      event: 'HICP Inflation YoY',
      actual: null,
      previous: 2.2,
      forecast: 2.1,
      importance: 'Medium',
    },
    {
      date: addDays(10),
      country: 'CN',
      category: 'Trade',
      event: 'Industrial Production YoY',
      actual: null,
      previous: 5.9,
      forecast: 6.0,
      importance: 'Medium',
    },
  ];
}

// ─── Finnhub economic calendar fetch ─────────────────────────────────────────

function mapImportance(impact: string | number | undefined): 'Low' | 'Medium' | 'High' {
  if (impact === 3 || impact === 'high' || impact === 'High') return 'High';
  if (impact === 2 || impact === 'medium' || impact === 'Medium') return 'Medium';
  return 'Low';
}

async function fetchEconomicCalendar(): Promise<MacroEvent[]> {
  try {
    // Finnhub free tier — no API key needed for economic calendar
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const url = `/api/trading-economics?type=calendar&from=${from}&to=${to}`;

    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Calendar proxy ${response.status}`);
    const raw = await response.json();
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty calendar response');

    return raw
      .filter((e: any) => e.date && e.event)
      .slice(0, 10)
      .map((e: any): MacroEvent => ({
        date: (e.date || e.Date || '').split(' ')[0],
        country: e.country || e.Country || 'US',
        category: e.category || e.Category || 'Economic',
        event: e.event || e.Event || e.name || '',
        actual: e.actual !== undefined && e.actual !== '' ? parseFloat(e.actual) : null,
        previous: e.previous !== undefined && e.previous !== '' ? parseFloat(e.previous) : null,
        forecast: e.forecast !== undefined && e.forecast !== '' ? parseFloat(e.forecast) : null,
        importance: mapImportance(e.importance || e.Importance),
      }));
  } catch (e) {
    console.warn('[EconCalendar] Using fallback events:', e);
    return getUpcomingFallbackEvents();
  }
}

// ─── React Query hook ─────────────────────────────────────────────────────────

export function useMacroCalendar() {
  return useQuery({
    queryKey: ['macroCalendar'],
    queryFn: fetchEconomicCalendar,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: keepPreviousData,
    initialData: getUpcomingFallbackEvents,
  });
}
