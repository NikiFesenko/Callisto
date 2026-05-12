/**
 * Serverless API proxy for Trading Economics.
 * Keeps API key server-side.
 * 
 * Environment variable required: TRADING_ECONOMICS_API_KEY
 */

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'calendar';

  const apiKey = process.env.TRADING_ECONOMICS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Trading Economics API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let endpoint = '';
  switch (type) {
    case 'calendar':
      endpoint = `https://api.tradingeconomics.com/calendar?c=${apiKey}&f=json`;
      break;
    case 'indicators':
      const country = url.searchParams.get('country') || 'united states';
      endpoint = `https://api.tradingeconomics.com/country/${encodeURIComponent(country)}?c=${apiKey}&f=json`;
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid type parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=900, stale-while-revalidate=1800',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
