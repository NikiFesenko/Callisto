/**
 * Economic Calendar API client.
 * Fetches live events from Finnhub via the Express /api/calendar proxy.
 * Finnhub API key is kept server-side.
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

async function fetchEconomicCalendar(): Promise<MacroEvent[]> {
  const response = await fetch('/api/calendar', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Calendar proxy error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Calendar response is not an array');
  }

  return data;
}

export function useMacroCalendar() {
  return useQuery({
    queryKey: ['macroCalendar'],
    queryFn: fetchEconomicCalendar,
    staleTime: 15 * 60 * 1000,  // 15 min
    gcTime:    60 * 60 * 1000,  // 1 hour
    placeholderData: keepPreviousData,
    retry: 2,
  });
}
