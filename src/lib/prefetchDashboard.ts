/**
 * Dashboard prefetch — warms all landing page queries as early as possible.
 *
 * Called immediately after the QueryClient is set up (before React renders).
 * If localStorage cache is fresh enough (within staleTime), the prefetch is
 * a no-op. Otherwise it fires all requests in parallel, so by the time the
 * Dashboard component mounts, data is already in-flight or resolved.
 *
 * This eliminates the "waterfall" where React renders → component mounts →
 * hooks call → fetch fires → spinner shows → data arrives.
 */
import { rangeToObservationStart } from '@/src/api/fred';
import { FRED_SERIES } from '@/src/lib/constants';
import { queryClient } from './queryClient';

const DEFAULT_RANGE = '1Y';

async function prefetchFRED(seriesId: string, range = DEFAULT_RANGE) {
  const observationStart = rangeToObservationStart(range);
  const params = new URLSearchParams({ series_id: seriesId });
  if (observationStart) params.set('observation_start', observationStart);

  return queryClient.prefetchQuery({
    queryKey:  ['fred', seriesId, { observationStart }],
    queryFn:   () => fetch(`/api/fred?${params}`, { headers: { Accept: 'application/json' } }).then(r => r.json()),
    staleTime: 60 * 60 * 1000,   // 1 hour — matches server Redis TTL
  });
}

async function prefetchBTCChart(range = DEFAULT_RANGE) {
  const cgDays: Record<string, string> = { '1D':'1','1W':'7','1M':'30','3M':'90','6M':'180','1Y':'365','ALL':'max' };
  const days = cgDays[range] ?? '365';
  return queryClient.prefetchQuery({
    queryKey: ['priceHistory', 'bitcoin', days],
    queryFn:  () => fetch(`/api/market/chart?id=bitcoin&days=${days}`, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(d => (d.prices ?? []).map(([timestamp, price]: [number, number]) => ({ timestamp, price }))),
    staleTime: 5 * 60 * 1000,
  });
}

async function prefetchMarketPrices() {
  const ids = 'bitcoin,solana,ethereum';
  return queryClient.prefetchQuery({
    queryKey: ['marketData', ids],
    queryFn:  () => fetch(`/api/market/prices?ids=${ids}`, { headers: { Accept: 'application/json' } }).then(r => r.json()),
    staleTime: 60 * 1000,
  });
}

async function prefetchNews() {
  return queryClient.prefetchQuery({
    queryKey: ['cryptoNews'],
    queryFn:  () => fetch('/api/news', { headers: { Accept: 'application/json' } }).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fire all dashboard prefetches in parallel.
 * Errors are silently swallowed — components have their own error states.
 */
export function prefetchDashboard(): void {
  Promise.allSettled([
    prefetchFRED(FRED_SERIES.M2),
    prefetchFRED(FRED_SERIES.CPI),
    prefetchFRED(FRED_SERIES.FED_FUNDS),
    prefetchBTCChart(),
    prefetchMarketPrices(),
    prefetchNews(),
  ]).catch(() => {});
}
