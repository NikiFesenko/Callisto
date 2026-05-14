// @ts-nocheck — Tamagui v2 RC index-signature strict typing
import React from 'react';
import { YStack, XStack, Text } from '@/src/components/ui/core';
import { Colors } from '@/src/lib/constants';
import { formatUSD, formatNumber } from '@/src/lib/formatters';
import { StatusBadge } from '@/src/components/ui/StatusBadge';

interface TokenBalanceProps {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
  logoUrl?: string;
}

export function TokenBalance({
  symbol,
  name,
  balance,
  usdValue,
  change24h,
}: TokenBalanceProps) {
  const isPositive = change24h >= 0;

  return (
    <XStack
      paddingVertical="$3"
      paddingHorizontal="$3"
      borderBottomWidth={1}
      borderBottomColor={Colors.borderSubtle}
      alignItems="center"
      gap="$3"
      pressStyle={{ backgroundColor: Colors.bgHover }}
      animation="quick"
      accessibilityLabel={`${name}: ${balance} ${symbol}, worth ${formatUSD(usdValue)}`}
    >
      {/* Token icon placeholder */}
      <YStack
        width={40}
        height={40}
        borderRadius={20}
        backgroundColor={Colors.bgElevated}
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize={14} fontWeight="700" color={Colors.textPrimary}>
          {symbol.slice(0, 2)}
        </Text>
      </YStack>

      {/* Token info */}
      <YStack flex={1}>
        <Text fontSize={15} fontWeight="600" color={Colors.textPrimary}>
          {name}
        </Text>
        <Text fontSize={12} fontFamily="$mono" color={Colors.textSecondary}>
          {formatNumber(balance, balance < 1 ? 6 : 2)} {symbol}
        </Text>
      </YStack>

      {/* Value + change */}
      <YStack alignItems="flex-end">
        <Text fontSize={15} fontWeight="600" fontFamily="$mono" color={Colors.textPrimary}>
          {formatUSD(usdValue)}
        </Text>
        <StatusBadge
          label={`${isPositive ? '+' : ''}${change24h.toFixed(2)}%`}
          variant={isPositive ? 'positive' : 'negative'}
          size="sm"
        />
      </YStack>
    </XStack>
  );
}
