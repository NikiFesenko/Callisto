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

/**
 * Resolve a Google News RSS item to the real publisher article URL.
 *
 * WHY THIS EXISTS
 * ───────────────
 * rss2json returns item.link as a Google News redirect URL:
 *   https://news.google.com/rss/articles/CBMiXWh0dHBzOi8v...
 *
 * These redirects are Google-session-dependent. When a user with no active
 * Google session clicks one from a third-party web app, the redirect fails
 * silently and the browser stays on the current page (or opens a blank tab).
 *
 * HOW IT WORKS
 * ────────────
 * Strategy 1 (most reliable): rss2json's "description" field for Google News
 * items contains raw HTML from Google's feed, which includes an <a href="...">
 * pointing directly to the publisher article. We extract the first href that
 * is NOT a google.com domain — that is the real article URL.
 *
 * Strategy 2 (fallback): Convert the RSS-specific redirect path to the regular
 * Google News web article path. "/rss/articles/" → "/articles/" opens Google's
 * normal article page, which browsers handle correctly (auto-redirect to article).
 *
 * Strategy 3 (last resort): Return the original link unchanged.
 */
export function resolveGoogleNewsItem(item: {
  link?: string;
  description?: string;
  content?: string;
  [key: string]: any;
}): string {
  const link = item?.link ?? '';

  // ── Strategy 1: Extract real URL from description HTML ────────────────────
  // rss2json description for Google News looks like:
  //   <ol><li><a href="https://publisher.com/article">...</a></li>...</ol>
  const html = item?.description ?? item?.content ?? '';
  if (html) {
    // Match the first href that is NOT a google.com URL
    const match = html.match(/href="(https?:\/\/(?!(?:www\.)?google\.com)[^"]+)"/);
    if (match?.[1]) {
      return match[1];
    }
  }

  // ── Strategy 2: RSS redirect → web redirect ───────────────────────────────
  // /rss/articles/CBMi... → /articles/CBMi...
  // The web version of the redirect works normally in all browsers.
  if (link.includes('news.google.com/rss/articles/')) {
    return link.replace('/rss/articles/', '/articles/');
  }

  // ── Strategy 3: Return as-is ──────────────────────────────────────────────
  return link;
}

/** @deprecated Use resolveGoogleNewsItem instead */
export function decodeGoogleNewsUrl(googleUrl: string): string {
  return resolveGoogleNewsItem({ link: googleUrl });
}
