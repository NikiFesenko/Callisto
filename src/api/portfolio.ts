import { apiRequest } from './client';

export interface Trade {
  id: number;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price_usd: number;
  tx_id: string | null;
  traded_at: string;
  created_at: string;
}

export interface TradeSummary {
  symbol: string;
  total_bought: number;
  total_sold: number;
  total_cost: number;
  total_proceeds: number;
  trade_count: number;
}

export interface NewTrade {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price_usd: number;
  tx_id?: string;
  traded_at?: string; // ISO date string; defaults to now
}

/** Fetch all trades for the logged-in user */
export async function getTrades(): Promise<Trade[]> {
  const data = await apiRequest<{ trades: Trade[] }>('/portfolio/trades');
  return data.trades;
}

/** Add a new trade entry */
export async function addTrade(trade: NewTrade): Promise<Trade> {
  const data = await apiRequest<{ trade: Trade }>('/portfolio/trades', {
    method: 'POST',
    body: JSON.stringify(trade),
  });
  return data.trade;
}

/** Delete a trade by ID */
export async function deleteTrade(id: number): Promise<void> {
  await apiRequest(`/portfolio/trades/${id}`, { method: 'DELETE' });
}

/** Get aggregated P&L summary per symbol */
export async function getPortfolioSummary(): Promise<TradeSummary[]> {
  const data = await apiRequest<{ summary: TradeSummary[] }>('/portfolio/summary');
  return data.summary;
}
