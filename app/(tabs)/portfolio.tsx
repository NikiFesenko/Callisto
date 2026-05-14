// @ts-nocheck
import { ChartCard } from '@/src/components/charts/ChartCard';
import { DonutChart, type DonutSegment } from '@/src/components/charts/DonutChart';
import { AnimatedCounter } from '@/src/components/ui/AnimatedCounter';
import { Text, YStack } from '@/src/components/ui/core';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PageShell } from '@/src/components/ui/PageShell';
import { ConnectButton } from '@/src/components/wallet/ConnectButton';
import { TokenBalance } from '@/src/components/wallet/TokenBalance';
import { Colors } from '@/src/lib/constants';
import { useWalletStore } from '@/src/store/useWalletStore';
import React from 'react';
import { Platform } from 'react-native';

const MOCK_TOKENS = [
  { symbol: 'SOL', name: 'Solana', balance: 24.5, usdValue: 4372.03, change24h: 3.21 },
  { symbol: 'USDC', name: 'USD Coin', balance: 2500.0, usdValue: 2500.0, change24h: 0.01 },
  { symbol: 'BONK', name: 'Bonk', balance: 15000000, usdValue: 435.0, change24h: -5.43 },
  { symbol: 'RAY', name: 'Raydium', balance: 120.0, usdValue: 312.0, change24h: 1.87 },
];

const DONUT_COLORS = [Colors.neonGreen, Colors.indigo, Colors.violet, '#F59E0B'];



export default function PortfolioScreen() {
  const { connected } = useWalletStore();
  const totalValue = MOCK_TOKENS.reduce((sum, t) => sum + t.usdValue, 0);

  const segments: DonutSegment[] = MOCK_TOKENS.map((t, i) => ({
    label: t.name, value: t.usdValue,
    color: DONUT_COLORS[i % DONUT_COLORS.length], symbol: t.symbol,
  }));

  return (
    <PageShell>
      <YStack gap="$4" paddingVertical="$4">
        {Platform.OS !== 'web' && (
          <YStack paddingHorizontal="$4" gap="$1">
            <Text fontSize={28} fontWeight="800" color={Colors.textPrimary}>Portfolio</Text>
            <Text fontSize={14} color={Colors.textSecondary}>Your on-chain assets</Text>
          </YStack>
        )}

        <YStack paddingHorizontal="$4">
          <ConnectButton />
        </YStack>

        {connected ? (
          <>
            {/* Net Worth */}
            <YStack paddingHorizontal="$4">
              <GlassCard elevated glow="green">
                <YStack alignItems="center" gap="$1" paddingVertical="$2">
                  <Text fontSize={12} color={Colors.textMuted} textTransform="uppercase" letterSpacing={1}>Total Net Worth</Text>
                  <AnimatedCounter value={totalValue} prefix="$" decimals={2} fontSize={36} color={Colors.textPrimary} />
                </YStack>
              </GlassCard>
            </YStack>

            {/* Donut Chart */}
            <YStack paddingHorizontal="$4">
              <ChartCard title="Asset Allocation">
                <DonutChart segments={segments} totalValue={totalValue} />
              </ChartCard>
            </YStack>

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
    </PageShell>
  );
}
