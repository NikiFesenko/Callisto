/**
 * Jupiter DEX Aggregator client for Solana token swaps.
 *
 * SECURITY:
 * - Slippage is capped at 100 bps (1%) — hardcoded protection
 * - Transactions are NEVER signed here — always sent to the wallet provider
 * - No private keys are ever stored or accessed
 */
import { API_URLS, TRADING } from '@/src/lib/constants';

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

export interface JupiterSwapResponse {
  swapTransaction: string; // base64 encoded
  lastValidBlockHeight: number;
}

/**
 * Get a swap quote from Jupiter
 */
export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps?: number
): Promise<JupiterQuote> {
  // SECURITY: Cap slippage at maximum allowed value
  const safeBps = Math.min(slippageBps || TRADING.DEFAULT_SLIPPAGE_BPS, TRADING.MAX_SLIPPAGE_BPS);

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: safeBps.toString(),
  });

  const response = await fetch(`${API_URLS.JUPITER_QUOTE}?${params}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter quote failed: ${error}`);
  }

  return response.json();
}

/**
 * Build a swap transaction from a quote.
 * Returns a serialized transaction for the wallet to sign.
 */
export async function buildJupiterSwapTx(
  quote: JupiterQuote,
  userPublicKey: string
): Promise<JupiterSwapResponse> {
  const response = await fetch(API_URLS.JUPITER_SWAP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      // Don't use dynamic slippage — our quote already has capped slippage
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter swap build failed: ${error}`);
  }

  return response.json();
}

/**
 * Get a human-readable price impact warning
 */
export function getPriceImpactSeverity(
  priceImpactPct: string
): 'low' | 'medium' | 'high' {
  const impact = parseFloat(priceImpactPct);
  if (impact < 0.5) return 'low';
  if (impact < 2) return 'medium';
  return 'high';
}
