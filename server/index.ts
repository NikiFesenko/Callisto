import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initSchema } from './db';
import { connectRedis, getCacheStats } from './redis';
import authRouter from './routes/auth';
import portfolioRouter from './routes/portfolio';
import walletProfileRouter from './routes/walletProfile';
import fredRouter from './routes/fred';
import calendarRouter from './routes/calendar';
import marketRouter from './routes/market';
import newsRouter from './routes/news';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.SERVER_PORT) || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev default
    'http://localhost:4173', // Vite preview
    'http://localhost:3000',
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Cache stats (dev/ops debug endpoint) ───────────────────────────────────────
app.get('/api/cache/stats', (_req, res) => {
  res.json(getCacheStats());
});

// ── Routes ─────────────────────────────────────────────────────────────────────
// Auth & user data
app.use('/api/auth', authRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/wallet', walletProfileRouter);
// External data proxies
app.use('/api/fred',     fredRouter);      // FRED macro data
app.use('/api/calendar', calendarRouter);  // Finnhub economic calendar
app.use('/api/market',   marketRouter);    // CoinGecko prices + charts
app.use('/api/news',     newsRouter);      // Crypto news

// ── 404 fallback ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Bootstrap ──────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    console.log('🔄  Applying database schema...');
    await initSchema();

    console.log('🔄  Connecting to Redis...');
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀  Colisto API server running on http://localhost:${PORT}`);
      console.log(`    Health:      http://localhost:${PORT}/api/health`);
      console.log(`    Cache stats: http://localhost:${PORT}/api/cache/stats`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
