/**
 * FRED (Federal Reserve Economic Data) API client.
 * Proxied through Express /api/fred — API key kept server-side.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FRED_SERIES } from '@/src/lib/constants';

export interface FREDObservation {
  date: string;
  value: string;
}

export interface FREDSeriesResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  count: number;
  observations: FREDObservation[];
}

interface FREDQueryOptions {
  observationStart?: string;
  observationEnd?: string;
  frequency?: 'a' | 'sa' | 'q' | 'sq' | 'm' | 'sm' | 'w' | 'd';
  units?: 'lin' | 'chg' | 'ch1' | 'pch' | 'pc1' | 'pca' | 'cch' | 'cca' | 'log';
}

// Map UI range labels to observationStart dates
export function rangeToObservationStart(range: string): string | undefined {
  const now = new Date();
  switch (range) {
    case '1M': { const d = new Date(now); d.setMonth(d.getMonth() - 1);       return d.toISOString().split('T')[0]; }
    case '3M': { const d = new Date(now); d.setMonth(d.getMonth() - 3);       return d.toISOString().split('T')[0]; }
    case '6M': { const d = new Date(now); d.setMonth(d.getMonth() - 6);       return d.toISOString().split('T')[0]; }
    case '1Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0]; }
    case '2Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 2); return d.toISOString().split('T')[0]; }
    case '5Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 5); return d.toISOString().split('T')[0]; }
    case 'ALL': return '2000-01-01';
    default:    return undefined;
  }
}

async function fetchFREDSeries(
  seriesId: string,
  options?: FREDQueryOptions
): Promise<FREDSeriesResponse> {
  const params = new URLSearchParams({ series_id: seriesId });
  if (options?.observationStart) params.set('observation_start', options.observationStart);
  if (options?.observationEnd)   params.set('observation_end',   options.observationEnd);
  if (options?.frequency)        params.set('frequency',         options.frequency);
  if (options?.units)            params.set('units',             options.units);

  const response = await fetch(`/api/fred?${params}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`FRED proxy error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.observations) {
    throw new Error('Invalid FRED response — no observations field');
  }

  return data;
}

// ─── React Query hooks ────────────────────────────────────────────────────────

export function useFREDSeries(seriesId: string, options?: FREDQueryOptions) {
  return useQuery({
    queryKey: ['fred', seriesId, options],
    queryFn: () => fetchFREDSeries(seriesId, options),
    staleTime: 60 * 60 * 1000,    // 1 hour — FRED data updates monthly
    gcTime:    4 * 60 * 60 * 1000, // 4 hours
    placeholderData: keepPreviousData,
    retry: 2,
  });
}

export function useLatestFREDValue(seriesId: string) {
  const { data, ...rest } = useFREDSeries(seriesId);
  const observations = data?.observations || [];
  const validObs = observations.filter(o => o.value !== '.');
  const latest   = validObs[validObs.length - 1];
  const previous = validObs[validObs.length - 2];

  const currentValue  = latest   ? parseFloat(latest.value)   : null;
  const previousValue = previous ? parseFloat(previous.value) : null;
  const change =
    currentValue !== null && previousValue !== null
      ? ((currentValue - previousValue) / previousValue) * 100
      : null;

  return {
    ...rest,
    currentValue,
    previousValue,
    change,
    latestDate: latest?.date || null,
  };
}
