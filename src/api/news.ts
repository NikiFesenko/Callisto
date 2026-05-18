/**
 * Crypto news API client.
 * Fetches real headlines from CryptoPanic (free, no API key required for basic news).
 * Falls back to representative headlines if unavailable.
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

// ─── Fallback news ────────────────────────────────────────────────────────────

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin Surges Past $100K as Institutional Demand Continues to Grow',
    url: 'https://www.coindesk.com',
    source: 'CoinDesk',
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    currencies: ['BTC'],
  },
  {
    id: '2',
    title: 'Federal Reserve Signals Cautious Approach to Rate Cuts Amid Inflation Data',
    url: 'https://www.bloomberg.com',
    source: 'Bloomberg',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    sentiment: 'neutral',
    currencies: [],
  },
  {
    id: '3',
    title: 'Solana Network Hits New Throughput Records as DeFi Activity Spikes',
    url: 'https://www.theblock.co',
    source: 'The Block',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    currencies: ['SOL'],
  },
  {
    id: '4',
    title: 'SEC Approves Spot Ethereum ETF Options Trading on Major Exchanges',
    url: 'https://www.coindesk.com',
    source: 'CoinDesk',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    currencies: ['ETH'],
  },
  {
    id: '5',
    title: 'M2 Money Supply Expansion Accelerates — What It Means for Crypto',
    url: 'https://cryptopanic.com',
    source: 'CryptoPanic',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    sentiment: 'neutral',
    currencies: ['BTC'],
  },
];

// ─── Fetch from CryptoPanic ───────────────────────────────────────────────────

function mapSentiment(votes: any): 'positive' | 'negative' | 'neutral' {
  if (!votes) return 'neutral';
  const pos = (votes.positive || 0) + (votes.liked || 0);
  const neg = (votes.negative || 0) + (votes.disliked || 0);
  if (pos > neg + 2) return 'positive';
  if (neg > pos + 2) return 'negative';
  return 'neutral';
}

async function fetchCryptoNews(): Promise<NewsItem[]> {
  try {
    // CryptoPanic free API — no auth key needed for public feed
    const url = 'https://cryptopanic.com/api/v1/posts/?auth_token=free&kind=news&public=true&filter=hot&currencies=BTC,ETH,SOL';
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`CryptoPanic ${response.status}`);
    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) throw new Error('Invalid CryptoPanic response');

    return data.results.slice(0, 10).map((item: any): NewsItem => ({
      id: String(item.id),
      title: item.title,
      url: item.url || item.source?.url || '#',
      source: item.source?.title || item.domain || 'CryptoPanic',
      publishedAt: item.published_at || item.created_at,
      sentiment: mapSentiment(item.votes),
      currencies: (item.currencies || []).map((c: any) => c.code),
    }));
  } catch {
    // Try CoinGecko news as secondary fallback
    try {
      const url = 'https://api.coingecko.com/api/v3/news';
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('CoinGecko news unavailable');
      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) throw new Error('Invalid response');

      return data.data.slice(0, 10).map((item: any, i: number): NewsItem => ({
        id: String(item.id || i),
        title: item.title,
        url: item.url,
        source: item.author || 'CoinGecko News',
        publishedAt: item.updated_at
          ? new Date(item.updated_at * 1000).toISOString()
          : new Date().toISOString(),
        sentiment: 'neutral',
        currencies: [],
      }));
    } catch {
      console.warn('[News] Both APIs unavailable, using fallback headlines');
      return FALLBACK_NEWS;
    }
  }
}

// ─── Time ago formatter ───────────────────────────────────────────────────────

export function timeAgo(isoDate: string): string {
  const now = Date.now();
  const diff = now - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── React Query hook ─────────────────────────────────────────────────────────

export function useCryptoNews() {
  return useQuery({
    queryKey: ['cryptoNews'],
    queryFn: fetchCryptoNews,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,  // refresh every 5 min
    placeholderData: keepPreviousData,
  });
}
