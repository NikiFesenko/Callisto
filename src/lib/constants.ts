// Colisto Design Token Constants
// These are used outside of Tamagui style props (charts, SVGs, raw styles)

export const Colors = {
  bgDeep: '#050505', // Thirdweb ultra-dark
  bgBase: '#09090b', // Zinc 950
  bgSoft: '#18181b', // Zinc 900
  bgHover: '#27272a', // Zinc 800
  bgElevated: '#18181b',
  border: '#27272a', // Subtle 1px lines
  borderSubtle: '#18181b',

  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  neonGreen: '#00FFA3', // Solana green
  neonGreenDim: '#00CC82',
  neonGreenGlow: 'rgba(0, 255, 163, 0.15)',
  coralRed: '#FF4D6A',
  coralRedDim: '#E0435E',
  coralRedGlow: 'rgba(255, 77, 106, 0.15)',

  indigo: '#6366F1',
  indigoGlow: 'rgba(99, 102, 241, 0.2)',
  violet: '#8B5CF6',
  
  // Solflare-inspired vibrant gradients
  gradientPrimary: 'linear-gradient(135deg, #8B5CF6 0%, #00FFA3 100%)',
  gradientSecondary: 'linear-gradient(135deg, #F97316 0%, #EAB308 100%)',

  glassBg: 'rgba(9, 9, 11, 0.65)',
  glassHover: 'rgba(24, 24, 27, 0.75)',
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
