/**
 * FRED (Federal Reserve Economic Data) API client.
 * All requests are proxied through a serverless function to protect API keys.
 * For development, we use mock data when the proxy is unavailable.
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
    date.setDate(date.getDate() + i * 7);
    currentVal += (Math.random() - 0.45) * (maxVal - minVal) * 0.02;
    currentVal = Math.max(minVal, Math.min(maxVal, currentVal));
    observations.push({
      date: date.toISOString().split('T')[0],
      value: currentVal.toFixed(2),
    });
  }
  return observations;
}

// Lazy mock data — only generated on first access, not at import time
const MOCK_DATA_CACHE: Record<string, FREDObservation[]> = {};
const MOCK_CONFIGS: Record<string, [number, number, number, string]> = {
  [FRED_SERIES.CPI]: [300, 260, 315, '2022-01-01'],
  [FRED_SERIES.FED_FUNDS]: [300, 0.25, 5.50, '2022-01-01'],
  [FRED_SERIES.M2]: [300, 15000, 21500, '2022-01-01'],
  [FRED_SERIES.GDP]: [60, 22000, 28500, '2022-01-01'],
  [FRED_SERIES.UNEMPLOYMENT]: [300, 3.4, 4.2, '2022-01-01'],
  [FRED_SERIES.TREASURY_10Y]: [300, 1.5, 4.8, '2022-01-01'],
  [FRED_SERIES.CORE_CPI]: [300, 280, 320, '2022-01-01'],
};
function getMockData(seriesId: string): FREDObservation[] {
  if (!MOCK_DATA_CACHE[seriesId]) {
    const cfg = MOCK_CONFIGS[seriesId];
    MOCK_DATA_CACHE[seriesId] = cfg
      ? generateMockTimeSeries(...cfg)
      : generateMockTimeSeries(100, 0, 100, '2022-01-01');
  }
  return MOCK_DATA_CACHE[seriesId];
}

function getMockResponse(seriesId: string): FREDSeriesResponse {
  const mockObs = getMockData(seriesId);
  return {
    realtime_start: '2022-01-01',
    realtime_end: new Date().toISOString().split('T')[0],
    observation_start: mockObs[0]?.date || '2022-01-01',
    observation_end: mockObs[mockObs.length - 1]?.date || new Date().toISOString().split('T')[0],
    units: 'lin',
    count: mockObs.length,
    observations: mockObs,
  };
}

// Set to false to try real API proxy, true to always use mock data
const USE_MOCK = true;

async function fetchFREDSeries(
  seriesId: string,
  _options?: FREDQueryOptions
): Promise<FREDSeriesResponse> {
  // Use mock data in dev (no proxy available)
  if (USE_MOCK) {
    return getMockResponse(seriesId);
  }

  try {
    const params = new URLSearchParams({
      series_id: seriesId,
      ...(_options?.observationStart && { observation_start: _options.observationStart }),
      ...(_options?.observationEnd && { observation_end: _options.observationEnd }),
      ...(_options?.frequency && { frequency: _options.frequency }),
      ...(_options?.units && { units: _options.units }),
    });

    const response = await fetch(`/api/fred?${params}`);
    if (!response.ok) throw new Error(`FRED API error: ${response.status}`);
    const data = await response.json();
    if (!data.observations) throw new Error('Invalid FRED response');
    return data;
  } catch {
    return getMockResponse(seriesId);
  }
}

export function useFREDSeries(seriesId: string, options?: FREDQueryOptions) {
  return useQuery({
    queryKey: ['fred', seriesId, options],
    queryFn: () => fetchFREDSeries(seriesId, options),
    staleTime: 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
    initialData: getMockResponse(seriesId),
  });
}

export function useLatestFREDValue(seriesId: string) {
  const { data, ...rest } = useFREDSeries(seriesId);
  const observations = data?.observations || [];
  const latest = observations[observations.length - 1];
  const previous = observations[observations.length - 2];

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
