/**
 * FRED (Federal Reserve Economic Data) API client.
 * Proxied through the serverless function at /api/fred to protect the API key.
 * Falls back to realistic mock data when the proxy is unavailable.
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
    case '1M': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; }
    case '3M': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]; }
    case '6M': { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0]; }
    case '1Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0]; }
    case '2Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 2); return d.toISOString().split('T')[0]; }
    case '5Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 5); return d.toISOString().split('T')[0]; }
    case 'ALL': return '2000-01-01';
    default: return undefined;
  }
}

// ─── Mock data generation ─────────────────────────────────────────────────────

function generateMockTimeSeries(
  count: number,
  minVal: number,
  maxVal: number,
  startDate: string
): FREDObservation[] {
  const start = new Date(startDate);
  const observations: FREDObservation[] = [];
  let currentVal = minVal + (maxVal - minVal) * 0.3;

  for (let i = 0; i < count; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i * 30); // monthly steps
    if (date > new Date()) break;
    currentVal += (Math.random() - 0.45) * (maxVal - minVal) * 0.02;
    currentVal = Math.max(minVal, Math.min(maxVal, currentVal));
    observations.push({
      date: date.toISOString().split('T')[0],
      value: currentVal.toFixed(2),
    });
  }
  return observations;
}

const MOCK_DATA_CACHE: Record<string, FREDObservation[]> = {};
const MOCK_CONFIGS: Record<string, [number, number, number, string]> = {
  [FRED_SERIES.CPI]:          [60, 298,  320,  '2020-01-01'],
  [FRED_SERIES.FED_FUNDS]:    [60, 0.08, 5.50, '2020-01-01'],
  [FRED_SERIES.M2]:           [60, 15500, 21600, '2020-01-01'],
  [FRED_SERIES.GDP]:          [20, 21000, 29000, '2020-01-01'],
  [FRED_SERIES.UNEMPLOYMENT]: [60, 3.4,  4.2,  '2020-01-01'],
  [FRED_SERIES.TREASURY_10Y]: [60, 0.5,  4.8,  '2020-01-01'],
  [FRED_SERIES.CORE_CPI]:     [60, 260,  322,  '2020-01-01'],
};

function getMockData(seriesId: string): FREDObservation[] {
  if (!MOCK_DATA_CACHE[seriesId]) {
    const cfg = MOCK_CONFIGS[seriesId];
    MOCK_DATA_CACHE[seriesId] = cfg
      ? generateMockTimeSeries(...cfg)
      : generateMockTimeSeries(60, 0, 100, '2020-01-01');
  }
  return MOCK_DATA_CACHE[seriesId];
}

function getMockResponse(seriesId: string): FREDSeriesResponse {
  const mockObs = getMockData(seriesId);
  return {
    realtime_start: '2020-01-01',
    realtime_end: new Date().toISOString().split('T')[0],
    observation_start: mockObs[0]?.date || '2020-01-01',
    observation_end: mockObs[mockObs.length - 1]?.date || new Date().toISOString().split('T')[0],
    units: 'lin',
    count: mockObs.length,
    observations: mockObs,
  };
}

// ─── Real FRED API via proxy ──────────────────────────────────────────────────

async function fetchFREDSeries(
  seriesId: string,
  options?: FREDQueryOptions
): Promise<FREDSeriesResponse> {
  try {
    const params = new URLSearchParams({ series_id: seriesId });
    if (options?.observationStart) params.set('observation_start', options.observationStart);
    if (options?.observationEnd)   params.set('observation_end',   options.observationEnd);
    if (options?.frequency)        params.set('frequency',         options.frequency);
    if (options?.units)            params.set('units',             options.units);

    const response = await fetch(`/api/fred?${params}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`FRED proxy ${response.status}`);
    const data = await response.json();
    if (!data.observations) throw new Error('Invalid FRED response (no observations)');
    return data;
  } catch (e) {
    console.warn(`[FRED] Proxy unavailable for ${seriesId}, using mock:`, e);
    return getMockResponse(seriesId);
  }
}

// ─── React Query hooks ────────────────────────────────────────────────────────

export function useFREDSeries(seriesId: string, options?: FREDQueryOptions) {
  return useQuery({
    queryKey: ['fred', seriesId, options],
    queryFn: () => fetchFREDSeries(seriesId, options),
    staleTime: 60 * 60 * 1000,     // 1 hour
    gcTime: 4 * 60 * 60 * 1000,    // 4 hours
    placeholderData: keepPreviousData,
    initialData: getMockResponse(seriesId),
  });
}

export function useLatestFREDValue(seriesId: string) {
  const { data, ...rest } = useFREDSeries(seriesId);
  const observations = data?.observations || [];
  const validObs = observations.filter(o => o.value !== '.');
  const latest = validObs[validObs.length - 1];
  const previous = validObs[validObs.length - 2];

  const currentValue = latest ? parseFloat(latest.value) : null;
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
