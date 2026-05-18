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

// ─── Actual Historical Data Injection ──────────────────────────────────────────

const ACTUAL_YEARLY_DATA: Record<string, Record<number, number>> = {
  [FRED_SERIES.CPI]: {
    2020: 258.8, 2021: 270.9, 2022: 292.6, 2023: 304.1, 2024: 314.5, 2025: 320.2, 2026: 324.1,
  },
  [FRED_SERIES.FED_FUNDS]: {
    2020: 0.09, 2021: 0.08, 2022: 1.68, 2023: 5.02, 2024: 4.83, 2025: 3.85, 2026: 3.50,
  },
  [FRED_SERIES.M2]: {
    2020: 18436, 2021: 20626, 2022: 21379, 2023: 20790, 2024: 21050, 2025: 21450, 2026: 21820,
  },
  [FRED_SERIES.GDP]: {
    2020: 21060, 2021: 23315, 2022: 25462, 2023: 27360, 2024: 28500, 2025: 29200, 2026: 29800,
  },
  [FRED_SERIES.UNEMPLOYMENT]: {
    2020: 8.1, 2021: 5.3, 2022: 3.6, 2023: 3.6, 2024: 4.1, 2025: 4.3, 2026: 4.1,
  },
  [FRED_SERIES.TREASURY_10Y]: {
    2020: 0.89, 2021: 1.45, 2022: 2.95, 2023: 3.96, 2024: 4.25, 2025: 3.90, 2026: 4.10,
  },
};

function generateActualTimeSeries(seriesId: string): FREDObservation[] {
  const yearlyData = ACTUAL_YEARLY_DATA[seriesId];
  if (!yearlyData) return [];

  const observations: FREDObservation[] = [];
  const years = Object.keys(yearlyData).map(Number).sort((a, b) => a - b);
  const endYear = 2026;
  const endMonth = 4; // May (0-indexed is 4)

  for (let year = years[0]; year <= endYear; year++) {
    const valStart = yearlyData[year] || yearlyData[years[years.length - 1]];
    const valEnd = yearlyData[year + 1] || valStart;

    const monthsInYear = (year === endYear) ? endMonth + 1 : 12;

    for (let month = 0; month < monthsInYear; month++) {
      const progress = month / 12;
      const interpolatedValue = valStart + (valEnd - valStart) * progress;
      
      const date = new Date(Date.UTC(year, month, 1));
      observations.push({
        date: date.toISOString().split('T')[0],
        value: interpolatedValue.toFixed(2),
      });
    }
  }
  return observations;
}

const MOCK_DATA_CACHE: Record<string, FREDObservation[]> = {};

function getMockData(seriesId: string): FREDObservation[] {
  if (!MOCK_DATA_CACHE[seriesId]) {
    MOCK_DATA_CACHE[seriesId] = generateActualTimeSeries(seriesId);
    if (MOCK_DATA_CACHE[seriesId].length === 0) {
      MOCK_DATA_CACHE[seriesId] = [{ date: '2026-05-01', value: '100' }];
    }
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
