/**
 * Crypto news client.
 * Proxied through Express /api/news — fixes browser CORS block.
 * Source: CoinGecko news (no key required).
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  currencies?: string[];
}

async function fetchCryptoNews(): Promise<NewsItem[]> {
  const response = await fetch('/api/news', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`News proxy error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('News response is not an array');
  }

  return data;
}

// ─── Time ago formatter ───────────────────────────────────────────────────────

export function timeAgo(isoDate: string): string {
  const now  = Date.now();
  const diff = now - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── React Query hook ─────────────────────────────────────────────────────────

export function useCryptoNews() {
  return useQuery({
    queryKey: ['cryptoNews'],
    queryFn: fetchCryptoNews,
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 2,
  });
}
