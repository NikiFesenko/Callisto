import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initSchema } from './db';
import authRouter from './routes/auth';
import portfolioRouter from './routes/portfolio';

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

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/portfolio', portfolioRouter);

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

    app.listen(PORT, () => {
      console.log(`🚀  Colisto API server running on http://localhost:${PORT}`);
      console.log(`    Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
