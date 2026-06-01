import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All portfolio routes require authentication
router.use(authenticateToken);

// ── GET /api/portfolio/trades ─────────────────────────────────────────────────
// Returns all trades for the authenticated user, newest first
router.get('/trades', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT
        id, symbol, side, quantity, price_usd, tx_id, traded_at, created_at
       FROM portfolio_trades
       WHERE user_id = ?
       ORDER BY traded_at DESC`,
      [req.userId]
    );

    res.json({ trades: rows });
  } catch (err) {
    console.error('[portfolio/trades GET]', err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// ── POST /api/portfolio/trades ────────────────────────────────────────────────
// Add a new trade entry
router.post('/trades', async (req: AuthRequest, res: Response): Promise<void> => {
  const { symbol, side, quantity, price_usd, tx_id, traded_at } = req.body as {
    symbol?: string;
    side?: 'buy' | 'sell';
    quantity?: number;
    price_usd?: number;
    tx_id?: string;
    traded_at?: string;
  };

  if (!symbol || !side || quantity == null || price_usd == null) {
    res.status(400).json({ error: 'symbol, side, quantity, and price_usd are required' });
    return;
  }

  if (!['buy', 'sell'].includes(side)) {
    res.status(400).json({ error: 'side must be "buy" or "sell"' });
    return;
  }

  if (quantity <= 0 || price_usd < 0) {
    res.status(400).json({ error: 'quantity must be positive and price_usd must be non-negative' });
    return;
  }

  try {
    const tradeDate = traded_at ? new Date(traded_at) : new Date();

    const [result] = await pool.execute<any>(
      `INSERT INTO portfolio_trades
        (user_id, symbol, side, quantity, price_usd, tx_id, traded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, symbol.toUpperCase(), side, quantity, price_usd, tx_id || null, tradeDate]
    );

    const insertId = (result as any).insertId;

    // Return the newly created row
    const [rows] = await pool.execute<any[]>(
      'SELECT id, symbol, side, quantity, price_usd, tx_id, traded_at, created_at FROM portfolio_trades WHERE id = ?',
      [insertId]
    );

    res.status(201).json({ trade: (rows as any[])[0] });
  } catch (err) {
    console.error('[portfolio/trades POST]', err);
    res.status(500).json({ error: 'Failed to add trade' });
  }
});

// ── DELETE /api/portfolio/trades/:id ─────────────────────────────────────────
// Delete a trade — only the owning user can delete
router.delete('/trades/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const tradeId = parseInt(req.params.id, 10);

  if (isNaN(tradeId)) {
    res.status(400).json({ error: 'Invalid trade ID' });
    return;
  }

  try {
    const [result] = await pool.execute<any>(
      'DELETE FROM portfolio_trades WHERE id = ? AND user_id = ?',
      [tradeId, req.userId]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: 'Trade not found or not owned by you' });
      return;
    }

    res.json({ success: true, deletedId: tradeId });
  } catch (err) {
    console.error('[portfolio/trades DELETE]', err);
    res.status(500).json({ error: 'Failed to delete trade' });
  }
});

// ── GET /api/portfolio/summary ────────────────────────────────────────────────
// Aggregate P&L summary per symbol
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT
        symbol,
        SUM(CASE WHEN side = 'buy'  THEN quantity ELSE 0 END) AS total_bought,
        SUM(CASE WHEN side = 'sell' THEN quantity ELSE 0 END) AS total_sold,
        SUM(CASE WHEN side = 'buy'  THEN quantity * price_usd ELSE 0 END) AS total_cost,
        SUM(CASE WHEN side = 'sell' THEN quantity * price_usd ELSE 0 END) AS total_proceeds,
        COUNT(*) AS trade_count
       FROM portfolio_trades
       WHERE user_id = ?
       GROUP BY symbol
       ORDER BY symbol ASC`,
      [req.userId]
    );

    res.json({ summary: rows });
  } catch (err) {
    console.error('[portfolio/summary]', err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

export default router;
