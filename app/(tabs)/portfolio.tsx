// @ts-nocheck
import { ChartCard } from '@/src/components/charts/ChartCard';
import { DonutChart, type DonutSegment } from '@/src/components/charts/DonutChart';
import { AnimatedCounter } from '@/src/components/ui/AnimatedCounter';
import { Text, YStack, XStack } from '@/src/components/ui/core';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PageShell } from '@/src/components/ui/PageShell';
import { ConnectButton } from '@/src/components/wallet/ConnectButton';
import { TokenBalance } from '@/src/components/wallet/TokenBalance';
import { Colors } from '@/src/lib/constants';
import { useWalletStore } from '@/src/store/useWalletStore';
import { useAutomationStore } from '@/src/store/useAutomationStore';
import { TriggerCard } from '@/src/components/automations/TriggerCard';
import { useWatchlistStore } from '@/src/store/useWatchlistStore';
import { WatchlistCard } from '@/src/components/watchlist/WatchlistCard';
import { WatchlistSearchModal } from '@/src/components/watchlist/WatchlistSearchModal';
import topStocksData from '@/src/lib/data/top_stocks.json';
import { useStockPrices } from '@/src/lib/useStockPrices';
import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';

const MOCK_TOKENS = [
  { symbol: 'SOL', name: 'Solana', balance: 24.5, usdValue: 4372.03, change24h: 3.21 },
  { symbol: 'USDC', name: 'USD Coin', balance: 2500.0, usdValue: 2500.0, change24h: 0.01 },
  { symbol: 'BONK', name: 'Bonk', balance: 15000000, usdValue: 435.0, change24h: -5.43 },
  { symbol: 'RAY', name: 'Raydium', balance: 120.0, usdValue: 312.0, change24h: 1.87 },
];

const DONUT_COLORS = [Colors.neonGreen, Colors.indigo, Colors.violet, '#F59E0B'];



export default function PortfolioScreen() {
  const { connected, publicKey } = useWalletStore();
  const { automations } = useAutomationStore();
  const { symbols } = useWatchlistStore();
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  
  // Must be declared BEFORE useStockPrices (which consumes it)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Real-time prices from Yahoo Finance via Vite proxy
  const liveQuotes = useStockPrices(mounted ? symbols : []);

  const activeAutomations = (automations || []).filter(a => a.walletAddress === publicKey && a.enabled);
  const totalValue = MOCK_TOKENS.reduce((sum, t) => sum + t.usdValue, 0);

  const segments: DonutSegment[] = MOCK_TOKENS.map((t, i) => ({
    label: t.name, value: t.usdValue,
    color: DONUT_COLORS[i % DONUT_COLORS.length], symbol: t.symbol,
  }));

  return (
    <PageShell>
      <YStack gap="$4" paddingVertical="$4">
        {Platform.OS !== 'web' && (
          <YStack paddingHorizontal="$4" gap="$1" paddingBottom="$4">
            <Text fontSize={32} fontWeight="900" color={Colors.textPrimary} letterSpacing={-1}>Portfolio</Text>
            <Text fontSize={16} color={Colors.textSecondary}>Your on-chain assets</Text>
          </YStack>
        )}

        <YStack paddingHorizontal="$4">
          <ConnectButton />
        </YStack>

        {connected ? (
          <>
            {/* Net Worth */}
            <YStack paddingHorizontal="$4">
              <GlassCard elevated padding="$6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } as any}>
                <Text fontSize={13} color={Colors.textSecondary} textTransform="uppercase" letterSpacing={2} fontWeight="600">Total Net Worth</Text>
                <YStack paddingVertical="$1">
                  <AnimatedCounter value={totalValue} prefix="$" decimals={2} fontSize={48} fontWeight="900" color={Colors.textPrimary} />
                </YStack>
              </GlassCard>
            </YStack>

            {/* Donut Chart */}
            <YStack paddingHorizontal="$4">
              <ChartCard title="Asset Allocation">
                <DonutChart segments={segments} totalValue={totalValue} />
              </ChartCard>
            </YStack>

            {/* Active Automations */}
            {activeAutomations.length > 0 && (
              <YStack paddingHorizontal="$4" marginTop="$4">
                <Text fontSize={20} fontWeight="800" color={Colors.textPrimary} marginBottom="$3" letterSpacing={-0.5}>Active Bots</Text>
                <YStack gap="$3">
                  {activeAutomations.map(auto => (
                    <TriggerCard key={auto.id} automation={auto} />
                  ))}
                </YStack>
              </YStack>
            )}

            {/* Token List */}
            <YStack paddingHorizontal="$4">
              <GlassCard elevated padding="$0">
                <YStack padding="$3" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}>
                  <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>Holdings</Text>
                </YStack>
                {MOCK_TOKENS.map((token) => (
                  <TokenBalance key={token.symbol} {...token} />
                ))}
              </GlassCard>
            </YStack>

            {/* Watchlist */}
            <YStack paddingHorizontal="$4" marginTop="$4">
              <GlassCard elevated padding="$0">
                <XStack padding="$3" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle} justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>Watchlist</Text>
                    {mounted && symbols.length > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: '#00FFA3',
                        background: 'rgba(0,255,163,0.1)',
                        border: '1px solid rgba(0,255,163,0.25)',
                        padding: '2px 7px', borderRadius: 100,
                      }}>● LIVE</span>
                    )}
                  </XStack>
                  <button
                    onClick={() => setIsWatchlistModalOpen(true)}
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)', border: 'none', color: Colors.violet,
                      padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 'bold',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                  >
                    + Add Stocks
                  </button>
                </XStack>
                
                {!mounted ? null : symbols.length === 0 ? (
                  <YStack padding="$6" alignItems="center">
                    <Text fontSize={14} color={Colors.textSecondary} textAlign="center">
                      Your watchlist is empty. Add top performing stocks to track them here.
                    </Text>
                  </YStack>
                ) : (
                  symbols.map(symbol => {
                    const stockData = (topStocksData as any[]).find(s => s.symbol === symbol);
                    if (!stockData) return null;
                    // Merge live quote over static data (live wins)
                    const live = liveQuotes[symbol];
                    const price = (live && !live.loading && !live.error && live.price > 0)
                      ? live.price : stockData.price;
                    const change24h = (live && !live.loading && !live.error && live.price > 0)
                      ? live.changePercent : stockData.change24h;
                    return <WatchlistCard key={symbol} {...stockData} price={price} change24h={change24h} liveLoading={live?.loading} />;
                  })
                )}
              </GlassCard>
            </YStack>
          </>
        ) : (
          <YStack paddingHorizontal="$4" paddingTop="$8" alignItems="center" gap="$4">
            <Text fontSize={48}>🔒</Text>
            <Text fontSize={18} fontWeight="600" color={Colors.textPrimary} textAlign="center">
              Connect Your Wallet
            </Text>
            <Text fontSize={14} color={Colors.textSecondary} textAlign="center" maxWidth={300}>
              Connect a Solana wallet to view your portfolio, token balances, and asset allocation.
            </Text>
          </YStack>
        )}
      </YStack>

      {isWatchlistModalOpen && (
        <WatchlistSearchModal onClose={() => setIsWatchlistModalOpen(false)} />
      )}
    </PageShell>
  );
}
