/**
 * Serverless API proxy for FRED (Federal Reserve Economic Data).
 * This function keeps the API key server-side, never exposing it to the frontend.
 * 
 * Deploy as a Vercel Edge Function, Firebase Cloud Function, or similar.
 * 
 * Environment variable required: FRED_API_KEY
 */

// For Vercel Edge Functions:
export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const seriesId = url.searchParams.get('series_id');

  if (!seriesId) {
    return new Response(JSON.stringify({ error: 'series_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'FRED API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Forward allowed params
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
  });

  const allowedParams = ['observation_start', 'observation_end', 'frequency', 'units'];
  for (const param of allowedParams) {
    const val = url.searchParams.get(param);
    if (val) params.set(param, val);
  }

  try {
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?${params}`,
      {
        headers: { 'User-Agent': 'Colisto/1.0' },
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
