/**
 * CoinGecko API client for crypto price data.
 * Uses the free tier — no API key needed.
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

type TimeRange = '1' | '7' | '30' | '90' | '365' | 'max';

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
    current_price: 97432.18, market_cap: 1920000000000,
    price_change_percentage_24h: 2.34, price_change_percentage_7d: 5.12, image: '',
  },
  {
    id: 'solana', symbol: 'sol', name: 'Solana',
    current_price: 178.45, market_cap: 84000000000,
    price_change_percentage_24h: -1.23, price_change_percentage_7d: 8.45, image: '',
  },
  {
    id: 'ethereum', symbol: 'eth', name: 'Ethereum',
    current_price: 3245.67, market_cap: 390000000000,
    price_change_percentage_24h: 1.56, price_change_percentage_7d: 3.78, image: '',
  },
];

// Lazy mock data — only generated on first access
const MOCK_HISTORY_CACHE: Record<string, PricePoint[]> = {};
const MOCK_HISTORY_CONFIGS: Record<string, [number, number, number]> = {
  bitcoin: [365, 97000, 3],
  solana: [365, 178, 5],
  ethereum: [365, 3200, 4],
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

function getMockHistory(coinId: string, days: TimeRange): PricePoint[] {
  const daysNum = days === 'max' ? 365 : parseInt(days);
  return getLazyMockHistory(coinId).slice(-daysNum);
}

async function fetchPriceHistory(coinId: string, days: TimeRange): Promise<PricePoint[]> {
  try {
    const response = await fetch(
      `${API_URLS.COINGECKO}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    );
    if (!response.ok) throw new Error('CoinGecko API error');
    const data = await response.json();
    if (!data.prices) throw new Error('Invalid response');
    return data.prices.map(([timestamp, price]: [number, number]) => ({ timestamp, price }));
  } catch {
    return getMockHistory(coinId, days);
  }
}

async function fetchMarketData(): Promise<CoinMarketData[]> {
  try {
    const response = await fetch(
      `${API_URLS.COINGECKO}/coins/markets?vs_currency=usd&ids=bitcoin,solana,ethereum&order=market_cap_desc&sparkline=true&price_change_percentage=7d`
    );
    if (!response.ok) throw new Error('CoinGecko API error');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid response');
    return data;
  } catch {
    return MOCK_MARKET_DATA;
  }
}

export function usePriceHistory(coinId: string, days: TimeRange = '365') {
  return useQuery({
    queryKey: ['priceHistory', coinId, days],
    queryFn: () => fetchPriceHistory(coinId, days),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    initialData: getMockHistory(coinId, days),
  });
}

export function useMarketData() {
  return useQuery({
    queryKey: ['marketData'],
    queryFn: fetchMarketData,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    initialData: MOCK_MARKET_DATA,
  });
}
