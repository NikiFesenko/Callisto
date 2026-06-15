/**
 * CoinGecko API client — prices and chart history.
 * Proxied through Express /api/market to avoid browser CORS and rate limits.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  sparkline_in_7d?: { price: number[] };
  image: string;
}

export type TimeRange = '1' | '7' | '30' | '90' | '180' | '365' | 'max';
export type UIRange   = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const UI_TO_CG_DAYS: Record<string, TimeRange> = {
  '1D':  '1',
  '1W':  '7',
  '1M':  '30',
  '3M':  '90',
  '6M':  '180',
  '1Y':  '365',
  'ALL': 'max',
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchPriceHistory(coinId: string, days: string): Promise<PricePoint[]> {
  const response = await fetch(`/api/market/chart?id=${coinId}&days=${days}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Market chart error: ${response.status}`);

  const data = await response.json();
  if (!data.prices || !Array.isArray(data.prices)) {
    throw new Error('Invalid chart response shape');
  }

  return data.prices.map(([timestamp, price]: [number, number]) => ({ timestamp, price }));
}

async function fetchMarketData(ids: string): Promise<CoinMarketData[]> {
  const response = await fetch(`/api/market/prices?ids=${ids}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Market prices error: ${response.status}`);

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Empty market data response');
  }

  return data;
}

// ─── React Query hooks ────────────────────────────────────────────────────────

export function usePriceHistory(coinId: string, days: string = '365') {
  const cgDays = UI_TO_CG_DAYS[days] ?? days;
  return useQuery({
    queryKey: ['priceHistory', coinId, cgDays],
    queryFn: () => fetchPriceHistory(coinId, cgDays),
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 2,
  });
}

/**
 * @param ids Comma-separated CoinGecko coin IDs e.g. "bitcoin,solana,ethereum"
 */
export function useMarketData(ids: string = 'bitcoin,solana,ethereum') {
  return useQuery({
    queryKey: ['marketData', ids],
    queryFn: () => fetchMarketData(ids),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}
