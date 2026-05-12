/**
 * Number and currency formatting utilities for financial data display.
 * Uses monospace-friendly formatting for the trading dashboard UI.
 */

/**
 * Format a number as USD currency
 */
export function formatUSD(value: number, compact = false): string {
  if (compact) {
    return formatCompact(value, { style: 'currency', currency: 'USD' });
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with commas and decimals
 */
export function formatNumber(
  value: number,
  decimals = 2,
  compact = false
): string {
  if (compact) {
    return formatCompact(value, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format as percentage (e.g., 3.2 → "3.20%")
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers compactly (1.2M, 3.4B, etc.)
 */
function formatCompact(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    ...options,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Truncate a Solana address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format a token amount respecting decimals
 */
export function formatTokenAmount(
  amount: number,
  decimals: number,
  symbol?: string
): string {
  const formatted = formatNumber(amount / Math.pow(10, decimals), decimals > 6 ? 4 : 2);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format a date for chart axis labels
 */
export function formatChartDate(dateStr: string, format: 'short' | 'medium' | 'full' = 'short'): string {
  const date = new Date(dateStr);
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    case 'medium':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'full':
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatChartDate(date.toISOString(), 'medium');
}
