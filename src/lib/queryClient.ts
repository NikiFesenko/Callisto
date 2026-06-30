/**
 * Shared QueryClient with localStorage persistence.
 *
 * How it works:
 *  - On first visit: fetches data from the server, stores it in localStorage
 *  - On subsequent visits/refreshes: instantly shows cached data from localStorage
 *    while quietly revalidating in the background (stale-while-revalidate pattern)
 *  - Cache is versioned — bumping CACHE_BUSTER_KEY invalidates stale persisted data
 *
 * TTL strategy (aligned with server-side Redis TTLs):
 *  - FRED data (CPI/M2/Fed):  1 hour  (updates monthly, server caches 1h)
 *  - BTC price history:        5 min   (server caches 5min)
 *  - Market prices:            1 min   (server caches 1min)
 *  - Crypto news:              5 min   (server caches 5min)
 */
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Bump this string whenever the data shape changes to bust all persisted caches
export const CACHE_VERSION = 'colisto-cache-v2';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults — individual hooks override per-query
      staleTime:            5 * 60 * 1000,   // 5 min default
      gcTime:               24 * 60 * 60 * 1000, // 24h — keep data alive in localStorage long enough
      retry:                2,
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
  },
});

// localStorage persister — synchronous, zero-dependency, works in all browsers
export const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: CACHE_VERSION,
  // Throttle writes so rapid sequential fetches don't hammer localStorage
  throttleTime: 1000,
  // Serialize/deserialize with error handling
  serialize:   (data) => {
    try { return JSON.stringify(data); }
    catch { return '{}'; }
  },
  deserialize: (str) => {
    try { return JSON.parse(str); }
    catch { return undefined; }
  },
});
