import { useState, useEffect, useRef } from 'react';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;        // absolute $
  changePercent: number; // %
  prevClose: number;
  currency: string;
  marketState: 'REGULAR' | 'PRE' | 'POST' | 'CLOSED' | string;
  loading: boolean;
  error?: string;
}

type PriceCache = Record<string, { quote: StockQuote; fetchedAt: number }>;

const CACHE_TTL_MS = 60_000; // refresh every 60 seconds
const globalCache: PriceCache = {};

/**
 * Fetch a real-time quote for a single symbol via the Vite proxy
 * (dev: /api/yahoo → query1.finance.yahoo.com)
 * Falls back gracefully if the fetch fails.
 */
async function fetchQuote(symbol: string): Promise<StockQuote> {
  const cached = globalCache[symbol];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.quote;
  }

  try {
    // The Vite proxy rewrites /api/yahoo → https://query1.finance.yahoo.com
    const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('No meta in response');

    const price      = meta.regularMarketPrice     ?? 0;
    const prevClose  = meta.chartPreviousClose     ?? meta.previousClose ?? price;
    const change     = price - prevClose;
    const changePct  = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    const quote: StockQuote = {
      symbol,
      price,
      change,
      changePercent: changePct,
      prevClose,
      currency: meta.currency ?? 'USD',
      marketState: meta.marketState ?? 'REGULAR',
      loading: false,
    };

    globalCache[symbol] = { quote, fetchedAt: Date.now() };
    return quote;
  } catch (err: any) {
    const fallback: StockQuote = {
      symbol, price: 0, change: 0, changePercent: 0,
      prevClose: 0, currency: 'USD', marketState: 'CLOSED',
      loading: false, error: err?.message ?? 'fetch failed',
    };
    return fallback;
  }
}

/**
 * Hook — takes an array of symbols, returns a map of symbol → StockQuote.
 * Fetches in parallel, updates every 60s, cleans up on unmount.
 */
export function useStockPrices(symbols: string[]): Record<string, StockQuote> {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>(() =>
    Object.fromEntries(symbols.map(s => [s, {
      symbol: s, price: 0, change: 0, changePercent: 0,
      prevClose: 0, currency: 'USD', marketState: 'CLOSED', loading: true,
    }]))
  );
  const symbolsKey = symbols.join(',');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async (syms: string[]) => {
    if (!syms.length) return;
    // Batch in chunks of 5 to not hammer Yahoo
    const chunks: string[][] = [];
    for (let i = 0; i < syms.length; i += 5) chunks.push(syms.slice(i, i + 5));

    for (const chunk of chunks) {
      const results = await Promise.allSettled(chunk.map(fetchQuote));
      const newEntries: Record<string, StockQuote> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') newEntries[chunk[i]] = r.value;
      });
      setQuotes(prev => ({ ...prev, ...newEntries }));
    }
  };

  useEffect(() => {
    const syms = symbolsKey ? symbolsKey.split(',').filter(Boolean) : [];
    if (!syms.length) { setQuotes({}); return; }

    // Seed loading state for any new symbols
    setQuotes(prev => {
      const next = { ...prev };
      syms.forEach(s => { if (!next[s]) next[s] = { symbol: s, price: 0, change: 0, changePercent: 0, prevClose: 0, currency: 'USD', marketState: 'CLOSED', loading: true }; });
      return next;
    });

    refresh(syms);
    timerRef.current = setInterval(() => refresh(syms), CACHE_TTL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [symbolsKey]);

  return quotes;
}
