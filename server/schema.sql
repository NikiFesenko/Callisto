-- Colisto Database Schema
-- Run once on first startup (auto-applied by server/index.ts)

CREATE DATABASE IF NOT EXISTS colisto_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE colisto_db;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  wallet_address  VARCHAR(255) DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Portfolio Trades ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_trades (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  symbol      VARCHAR(32) NOT NULL,
  side        ENUM('buy', 'sell') NOT NULL,
  quantity    DECIMAL(20, 8) NOT NULL,
  price_usd   DECIMAL(20, 8) NOT NULL,
  tx_id       VARCHAR(255) DEFAULT NULL COMMENT 'Solana transaction hash, optional',
  traded_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_portfolio_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_symbol (symbol),
  INDEX idx_traded_at (traded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
