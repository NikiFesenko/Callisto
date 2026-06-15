/**
 * Redis cache client for Colisto.
 *
 * Provides a thin wrapper around the `redis` v4 client with:
 *  - Automatic JSON serialisation / deserialisation
 *  - A `wrap()` helper that implements the get-or-fetch pattern
 *  - Structured console logging for every cache HIT / MISS / SET
 *  - Graceful degradation — if Redis is unavailable the app keeps working,
 *    requests just go directly to upstream APIs
 */

import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

// ── Client singleton ──────────────────────────────────────────────────────────

let client: RedisClientType | null = null;
let connected = false;

export async function connectRedis(): Promise<void> {
  try {
    client = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.warn('[Redis] Max reconnect attempts reached — running without cache');
            return false; // stop trying
          }
          return Math.min(retries * 200, 2000); // exponential backoff up to 2s
        },
      },
    }) as RedisClientType;

    client.on('error', (err) => {
      // Don't crash on Redis errors — log and degrade gracefully
      if (connected) console.warn('[Redis] Connection error:', err.message);
    });

    client.on('ready', () => {
      connected = true;
      console.log(`🟥  Redis connected at ${REDIS_HOST}:${REDIS_PORT}`);
    });

    client.on('end', () => {
      connected = false;
    });

    await client.connect();
  } catch (err: any) {
    console.warn('[Redis] Could not connect — running without cache:', err.message);
    client = null;
    connected = false;
  }
}

// ── Cache stats (for /api/cache/stats) ───────────────────────────────────────

let hits = 0;
let misses = 0;

export function getCacheStats() {
  return { hits, misses, hitRate: hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) + '%' : 'N/A', connected };
}

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Get a cached value by key. Returns parsed JSON or null on miss / Redis down.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!client || !connected) return null;
  try {
    const raw = await client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Store a value in Redis with a TTL in seconds.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!client || !connected) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err: any) {
    console.warn(`[Redis] SET failed for key "${key}":`, err.message);
  }
}

/**
 * Delete a specific key (manual invalidation).
 */
export async function cacheDel(key: string): Promise<void> {
  if (!client || !connected) return;
  try {
    await client.del(key);
  } catch {}
}

/**
 * The main pattern: get-or-fetch.
 *
 * 1. Check Redis for `key`
 * 2. On HIT  → return cached value immediately
 * 3. On MISS → call `fetcher()`, store result in Redis with `ttlSeconds`, return result
 * 4. If Redis is down → always call fetcher() (no-op cache layer)
 *
 * @param key         - Unique cache key
 * @param ttlSeconds  - How long to cache the result
 * @param fetcher     - Async function that fetches fresh data
 */
export async function cacheWrap<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    hits++;
    console.log(`[Redis] HIT  ${key}`);
    return cached;
  }

  // Cache miss — fetch fresh data
  misses++;
  console.log(`[Redis] MISS ${key} → fetching upstream...`);
  const fresh = await fetcher();

  // Store in cache (fire-and-forget — don't block the response)
  cacheSet(key, fresh, ttlSeconds).then(() => {
    console.log(`[Redis] SET  ${key} TTL=${ttlSeconds}s`);
  });

  return fresh;
}

export { connected as isRedisConnected };
