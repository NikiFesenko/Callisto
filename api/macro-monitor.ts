/**
 * Background macro monitor — serverless CRON function.
 * 
 * Periodically checks FRED/Trading Economics for updated macro data,
 * compares against active automation rules, and sends push notifications
 * when conditions are met.
 * 
 * Deploy as a Vercel Cron Job or similar scheduled function.
 * 
 * Environment variables required:
 * - FRED_API_KEY
 * - PUSH_NOTIFICATION_KEY (for sending alerts)
 */

export const config = { runtime: 'edge' };

interface AutomationRule {
  id: string;
  indicator: string;
  operator: string;
  threshold: number;
  userId: string;
}

const FRED_INDICATORS: Record<string, string> = {
  CPI: 'CPIAUCSL',
  CORE_CPI: 'CPILFESL',
  FED_FUNDS: 'FEDFUNDS',
  M2: 'M2SL',
  GDP: 'GDP',
  UNEMPLOYMENT: 'UNRATE',
};

function evaluateCondition(
  actual: number,
  operator: string,
  threshold: number
): boolean {
  switch (operator) {
    case '>': return actual > threshold;
    case '<': return actual < threshold;
    case '>=': return actual >= threshold;
    case '<=': return actual <= threshold;
    case '==': return Math.abs(actual - threshold) < 0.001;
    default: return false;
  }
}

export default async function handler(_request: Request) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'FRED API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // In production, fetch active rules from a database
  // For now, return a status endpoint
  const results: Record<string, { value: number; date: string }> = {};

  for (const [key, seriesId] of Object.entries(FRED_INDICATORS)) {
    try {
      const params = new URLSearchParams({
        series_id: seriesId,
        api_key: apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit: '1',
      });

      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?${params}`
      );
      const data = await response.json();
      const latest = data.observations?.[0];

      if (latest && latest.value !== '.') {
        results[key] = {
          value: parseFloat(latest.value),
          date: latest.date,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
    }
  }

  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      indicators: results,
      message: 'Macro monitor check complete',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
