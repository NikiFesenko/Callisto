import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  try {
    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if ((existing as any[]).length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.execute<any>(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email.toLowerCase(), password_hash]
    );

    const userId = (result as any).insertId;

    const token = jwt.sign(
      { userId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    res.status(201).json({
      token,
      user: { id: userId, email: email.toLowerCase(), wallet_address: null },
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, email, password_hash, wallet_address FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    const user = (rows as any[])[0];

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallet_address,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized: Missing user ID' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, email, wallet_address, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    const user = (rows as any[])[0];

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('[me]', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── POST /api/auth/wallet-login ───────────────────────────────────────────────
// Authenticate or auto-register using a Solana wallet address
router.post('/wallet-login', async (req: Request, res: Response): Promise<void> => {
  const { wallet_address } = req.body as { wallet_address?: string };

  if (!wallet_address || wallet_address.length < 32) {
    res.status(400).json({ error: 'Valid wallet_address is required' });
    return;
  }

  try {
    // 1. Check if user already exists
    const [rows] = await pool.execute<any[]>(
      'SELECT id, email, wallet_address FROM users WHERE wallet_address = ?',
      [wallet_address]
    );

    let user = rows[0];

    // 2. If user doesn't exist, register them
    if (!user) {
      const [insertResult] = await pool.execute<any>(
        'INSERT INTO users (wallet_address) VALUES (?)',
        [wallet_address]
      );
      
      const newUserId = insertResult.insertId;
      user = { id: newUserId, email: null, wallet_address };
    }

    // 3. Sign JWT
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.wallet_address },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallet_address,
      },
    });
  } catch (err) {
    console.error('[wallet-login]', err);
    res.status(500).json({ error: 'Wallet authentication failed' });
  }
});

// ── PATCH /api/auth/wallet ────────────────────────────────────────────────────
// Links a Solana wallet address to the authenticated user
router.patch('/wallet', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { wallet_address } = req.body as { wallet_address?: string };

  if (!wallet_address) {
    res.status(400).json({ error: 'wallet_address is required' });
    return;
  }

  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized: Missing user ID' });
    return;
  }

  try {
    await pool.execute(
      'UPDATE users SET wallet_address = ? WHERE id = ?',
      [wallet_address, req.userId]
    );

    res.json({ success: true, wallet_address });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'This wallet is already linked to another account' });
      return;
    }
    console.error('[wallet]', err);
    res.status(500).json({ error: 'Failed to update wallet address' });
  }
});

export default router;
