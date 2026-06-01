import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from project root (one level up from /server)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'colisto',
  password: process.env.DB_PASS     || 'colisto_dev',
  database: process.env.DB_NAME     || 'colisto_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: '+00:00',
});

/**
 * Run schema.sql to create tables if they don't exist.
 * Called once on server startup. The pool already connects to DB_NAME,
 * so we skip CREATE DATABASE and USE statements — they would fail on
 * a pre-created database, and they're not needed when the pool is
 * already pointing at the right DB.
 */
export async function initSchema(): Promise<void> {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  // Remove single-line comments (-- ...) before splitting
  const stripped = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  // Split on semicolons, filter out empty statements and DB-level DDL
  const statements = stripped
    .split(';')
    .map((s) => s.trim())
    .filter((s) => {
      if (!s.length) return false;
      const upper = s.toUpperCase();
      // Skip CREATE DATABASE and USE — pool handles DB selection
      if (upper.startsWith('CREATE DATABASE') || upper.startsWith('USE ')) return false;
      return true;
    });

  const conn = await pool.getConnection();
  try {
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('✅  Database schema applied.');
  } finally {
    conn.release();
  }
}

export default pool;
