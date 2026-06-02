import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// ── Default profile values ─────────────────────────────────────────────────────
const DEFAULT_WATCHLIST: string[] = [];

const DEFAULT_PREFERENCES = {
  theme: 'dark' as const,
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  notificationsEnabled: true,
  automations: [] as unknown[],
};

// ── GET /api/wallet/:address/profile ──────────────────────────────────────────
// Returns the full profile for a wallet. Auto-creates one if it doesn't exist.
router.get('/:address/profile', async (req: Request, res: Response): Promise<void> => {
  const { address } = req.params;

  if (!address || address.length < 32) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT wallet_address, watchlist, preferences, created_at, updated_at FROM wallet_profiles WHERE wallet_address = ?',
      [address]
    );

    if ((rows as any[]).length > 0) {
      const row = (rows as any[])[0];
      res.json({
        profile: {
          wallet_address: row.wallet_address,
          watchlist: typeof row.watchlist === 'string' ? JSON.parse(row.watchlist) : row.watchlist,
          preferences: typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        created: false,
      });
      return;
    }

    // New wallet — create a default profile
    await pool.execute(
      'INSERT INTO wallet_profiles (wallet_address, watchlist, preferences) VALUES (?, ?, ?)',
      [address, JSON.stringify(DEFAULT_WATCHLIST), JSON.stringify(DEFAULT_PREFERENCES)]
    );

    res.status(201).json({
      profile: {
        wallet_address: address,
        watchlist: DEFAULT_WATCHLIST,
        preferences: DEFAULT_PREFERENCES,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      created: true,
    });
  } catch (err) {
    console.error('[wallet/profile GET]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── PUT /api/wallet/:address/watchlist ────────────────────────────────────────
// Replace the full watchlist array for a wallet (upsert).
router.put('/:address/watchlist', async (req: Request, res: Response): Promise<void> => {
  const { address } = req.params;
  const { symbols } = req.body as { symbols?: string[] };

  if (!address) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  if (!Array.isArray(symbols)) {
    res.status(400).json({ error: 'symbols must be an array of strings' });
    return;
  }

  // Sanitize — uppercase, dedupe, max 100 symbols
  const cleaned = [...new Set(symbols.map((s) => String(s).toUpperCase().trim()))].slice(0, 100);

  try {
    await pool.execute(
      `INSERT INTO wallet_profiles (wallet_address, watchlist, preferences)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE watchlist = VALUES(watchlist)`,
      [address, JSON.stringify(cleaned), JSON.stringify(DEFAULT_PREFERENCES)]
    );

    res.json({ watchlist: cleaned });
  } catch (err) {
    console.error('[wallet/watchlist PUT]', err);
    res.status(500).json({ error: 'Failed to save watchlist' });
  }
});

// ── PUT /api/wallet/:address/preferences ──────────────────────────────────────
// Merge-update the preferences object for a wallet (upsert).
// Only the provided keys are updated — others are preserved.
router.put('/:address/preferences', async (req: Request, res: Response): Promise<void> => {
  const { address } = req.params;
  const updates = req.body as Partial<typeof DEFAULT_PREFERENCES>;

  if (!address) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  if (!updates || typeof updates !== 'object') {
    res.status(400).json({ error: 'Request body must be a preferences object' });
    return;
  }

  try {
    // Fetch existing preferences first (for merge)
    const [rows] = await pool.execute<any[]>(
      'SELECT preferences FROM wallet_profiles WHERE wallet_address = ?',
      [address]
    );

    const existing = (rows as any[]).length > 0
      ? (typeof (rows as any[])[0].preferences === 'string'
          ? JSON.parse((rows as any[])[0].preferences)
          : (rows as any[])[0].preferences)
      : DEFAULT_PREFERENCES;

    const merged = { ...existing, ...updates };

    await pool.execute(
      `INSERT INTO wallet_profiles (wallet_address, watchlist, preferences)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE preferences = VALUES(preferences)`,
      [address, JSON.stringify(DEFAULT_WATCHLIST), JSON.stringify(merged)]
    );

    res.json({ preferences: merged });
  } catch (err) {
    console.error('[wallet/preferences PUT]', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

export default router;
