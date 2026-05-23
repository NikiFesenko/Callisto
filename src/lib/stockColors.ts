// Deterministic sector → color mapping for the Aster exchange aesthetic
export const SECTOR_COLORS: Record<string, string> = {
  'Technology':              '#00D4FF', // cyan
  'Communication Services':  '#38BDF8', // sky blue
  'Financials':              '#FFB800', // gold
  'Healthcare':              '#00FFA3', // neon green
  'Consumer Discretionary':  '#FF4D8D', // pink
  'Consumer Staples':        '#A78BFA', // lavender
  'Energy':                  '#FB923C', // orange
  'Industrials':             '#9D6FFF', // purple
  'Materials':               '#A3E635', // lime
  'Real Estate':             '#FCD34D', // amber
  'Utilities':               '#F472B6', // rose
  'Crypto':                  '#00FFA3', // same as healthcare green
};

export const DEFAULT_STOCK_COLOR = '#A1A1AA';

export function getStockColor(sector: string | undefined): string {
  if (!sector) return DEFAULT_STOCK_COLOR;
  return SECTOR_COLORS[sector] || DEFAULT_STOCK_COLOR;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}
