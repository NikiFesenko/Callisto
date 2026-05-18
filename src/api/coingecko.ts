/**
 * CoinGecko API client for real-time crypto price data.
 * Uses the free public tier — no API key required.
 * Falls back to realistic mock data if API is unavailable (rate limit, network, etc.)
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { API_URLS } from '@/src/lib/constants';

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

// Map our UI range labels to CoinGecko 'days' param
export type TimeRange = '1' | '7' | '30' | '90' | '180' | '365' | 'max';
export type UIRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const UI_TO_CG_DAYS: Record<string, TimeRange> = {
  '1D': '1',
  '1W': '7',
  '1M': '30',
  '3M': '90',
  '6M': '180',
  '1Y': '365',
  'ALL': 'max',
};

// ─── Mock fallback data ───────────────────────────────────────────────────────

function generateMockPriceHistory(days: number, basePrice: number, volatility: number): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  let price = basePrice * 0.6;

  for (let i = days; i >= 0; i--) {
    price += (Math.random() - 0.45) * volatility * basePrice * 0.01;
    price = Math.max(basePrice * 0.1, price);
    points.push({
      timestamp: now - i * 24 * 60 * 60 * 1000,
      price,
    });
  }
  return points;
}

const MOCK_MARKET_DATA: CoinMarketData[] = [
  {
    id: 'bitcoin', symbol: 'btc', name: 'Bitcoin',
    current_price: 103250, market_cap: 2040000000000,
    price_change_percentage_24h: 1.82, price_change_percentage_7d: 4.55, image: '',
  },
  {
    id: 'solana', symbol: 'sol', name: 'Solana',
    current_price: 172.30, market_cap: 81000000000,
    price_change_percentage_24h: -0.94, price_change_percentage_7d: 7.12, image: '',
  },
  {
    id: 'ethereum', symbol: 'eth', name: 'Ethereum',
    current_price: 2530.45, market_cap: 305000000000,
    price_change_percentage_24h: 2.14, price_change_percentage_7d: 6.33, image: '',
  },
];

const MOCK_HISTORY_CACHE: Record<string, PricePoint[]> = {};
const MOCK_HISTORY_CONFIGS: Record<string, [number, number, number]> = {
  bitcoin: [365, 103250, 3.5],
  solana: [365, 172, 5.5],
  ethereum: [365, 2530, 4.2],
};
function getLazyMockHistory(coinId: string): PricePoint[] {
  if (!MOCK_HISTORY_CACHE[coinId]) {
    const cfg = MOCK_HISTORY_CONFIGS[coinId];
    MOCK_HISTORY_CACHE[coinId] = cfg
      ? generateMockPriceHistory(...cfg)
      : generateMockPriceHistory(365, 100, 3);
  }
  return MOCK_HISTORY_CACHE[coinId];
}

function getMockHistory(coinId: string, days: string): PricePoint[] {
  const daysNum = days === 'max' ? 365 : parseInt(days) || 365;
  return getLazyMockHistory(coinId).slice(-Math.min(daysNum, 365));
}

// ─── Real API fetches ─────────────────────────────────────────────────────────

async function fetchPriceHistory(coinId: string, days: string): Promise<PricePoint[]> {
  try {
    const url = `${API_URLS.COINGECKO}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&precision=2`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
    const data = await response.json();
    if (!data.prices || !Array.isArray(data.prices)) throw new Error('Invalid response shape');
    return data.prices.map(([timestamp, price]: [number, number]) => ({ timestamp, price }));
  } catch (e) {
    console.warn('[CoinGecko] Falling back to mock history:', e);
    return getMockHistory(coinId, days);
  }
}

async function fetchMarketData(): Promise<CoinMarketData[]> {
  try {
    const url = `${API_URLS.COINGECKO}/coins/markets?vs_currency=usd&ids=bitcoin,solana,ethereum&order=market_cap_desc&sparkline=true&price_change_percentage=7d`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Empty response');
    return data;
  } catch (e) {
    console.warn('[CoinGecko] Falling back to mock market data:', e);
    return MOCK_MARKET_DATA;
  }
}

// ─── React Query hooks ────────────────────────────────────────────────────────

export function usePriceHistory(coinId: string, days: string = '365') {
  const cgDays = UI_TO_CG_DAYS[days] ?? days;
  return useQuery({
    queryKey: ['priceHistory', coinId, cgDays],
    queryFn: () => fetchPriceHistory(coinId, cgDays),
    staleTime: 5 * 60 * 1000,      // 5 min
    gcTime: 30 * 60 * 1000,         // 30 min
    placeholderData: keepPreviousData,
  });
}

export function useMarketData() {
  return useQuery({
    queryKey: ['marketData'],
    queryFn: fetchMarketData,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,    // refresh every 60s
    gcTime: 5 * 60 * 1000,
  });
}
