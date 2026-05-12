/**
 * Trading Economics API client (proxied through serverless function).
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

const MOCK_EVENTS: MacroEvent[] = [
  { date: '2026-05-12', country: 'US', category: 'Inflation', event: 'Core CPI YoY', actual: null, previous: 3.1, forecast: 2.9, importance: 'High' },
  { date: '2026-05-14', country: 'US', category: 'Interest Rate', event: 'Fed Interest Rate Decision', actual: null, previous: 4.50, forecast: 4.50, importance: 'High' },
  { date: '2026-05-15', country: 'US', category: 'GDP', event: 'GDP Growth Rate QoQ', actual: null, previous: 2.4, forecast: 2.1, importance: 'High' },
  { date: '2026-05-16', country: 'EU', category: 'Inflation', event: 'HICP YoY', actual: null, previous: 2.2, forecast: 2.0, importance: 'Medium' },
  { date: '2026-05-19', country: 'CN', category: 'GDP', event: 'Industrial Production YoY', actual: null, previous: 5.9, forecast: 6.1, importance: 'Medium' },
];

const USE_MOCK = true;

async function fetchMacroCalendar(): Promise<MacroEvent[]> {
  if (USE_MOCK) return MOCK_EVENTS;

  try {
    const response = await fetch('/api/trading-economics?type=calendar');
    if (!response.ok) throw new Error('Trading Economics API error');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid response');
    return data;
  } catch {
    return MOCK_EVENTS;
  }
}

export function useMacroCalendar() {
  return useQuery({
    queryKey: ['macroCalendar'],
    queryFn: fetchMacroCalendar,
    staleTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
    initialData: MOCK_EVENTS,
  });
}
