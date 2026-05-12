// Colisto Design Token Constants
// These are used outside of Tamagui style props (charts, SVGs, raw styles)

export const Colors = {
  bgDeep: '#060A12',
  bgBase: '#0A0E17',
  bgSoft: '#111827',
  bgHover: '#1A2235',
  bgElevated: '#1E293B',
  border: '#1E293B',
  borderSubtle: '#162032',

  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  neonGreen: '#00FF88',
  neonGreenDim: '#00CC6A',
  neonGreenGlow: 'rgba(0, 255, 136, 0.15)',
  coralRed: '#FF4D6A',
  coralRedDim: '#E0435E',
  coralRedGlow: 'rgba(255, 77, 106, 0.15)',

  indigo: '#6366F1',
  indigoGlow: 'rgba(99, 102, 241, 0.2)',
  violet: '#8B5CF6',

  glassBg: 'rgba(17, 24, 39, 0.7)',
  glassHover: 'rgba(26, 34, 53, 0.8)',
} as const;

// FRED series IDs used across the app
export const FRED_SERIES = {
  CPI: 'CPIAUCSL',
  CORE_CPI: 'CPILFESL',
  FED_FUNDS: 'FEDFUNDS',
  M2: 'M2SL',
  GDP: 'GDP',
  UNEMPLOYMENT: 'UNRATE',
  TREASURY_10Y: 'DGS10',
} as const;

// Solana token mint addresses
export const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
} as const;

// API endpoints (proxied through serverless functions)
export const API_URLS = {
  FRED_PROXY: '/api/fred',
  TRADING_ECONOMICS_PROXY: '/api/trading-economics',
  COINGECKO: 'https://api.coingecko.com/api/v3',
  JUPITER_QUOTE: 'https://quote-api.jup.ag/v6/quote',
  JUPITER_SWAP: 'https://quote-api.jup.ag/v6/swap',
  SOLANA_RPC: 'https://api.mainnet-beta.solana.com',
} as const;

// Trading defaults
export const TRADING = {
  MAX_SLIPPAGE_BPS: 100, // 1% max slippage — hardcoded for user protection
  DEFAULT_SLIPPAGE_BPS: 50, // 0.5% default
  MACRO_POLL_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
} as const;
