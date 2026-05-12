// @ts-nocheck
import React from 'react';
import { YStack, XStack, Text } from 'tamagui';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { AnimatedCounter } from '@/src/components/ui/AnimatedCounter';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { Colors } from '@/src/lib/constants';

interface KPICardProps {
  title: string;
  value: number | null;
  change: number | null;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  isLoading?: boolean;
  compact?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  prefix = '',
  suffix = '',
  decimals = 2,
  isLoading = false,
  compact = false,
}: KPICardProps) {
  if (isLoading) {
    return (
      <GlassCard
        minWidth={compact ? 150 : 180}
        flex={1}
        accessibilityLabel={`${title} loading`}
      >
        <YStack gap="$2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="title" width="50%" />
          <Skeleton variant="text" width="40%" />
        </YStack>
      </GlassCard>
    );
  }

  const isPositive = change !== null && change >= 0;
  const glowColor = change === null ? undefined : isPositive ? 'green' as const : 'red' as const;

  return (
    <GlassCard
      minWidth={compact ? 150 : 180}
      flex={1}
      glow={glowColor}
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      animation="quick"
      accessibilityLabel={`${title}: ${prefix}${value?.toFixed(decimals)}${suffix}, change ${change?.toFixed(2)}%`}
    >
      <YStack gap="$2">
        <Text
          fontSize={12}
          fontWeight="500"
          color={Colors.textSecondary}
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          {title}
        </Text>

        {value !== null ? (
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            fontSize={compact ? 22 : 28}
            color={Colors.textPrimary}
          />
        ) : (
          <Text fontSize={28} fontFamily="$mono" color={Colors.textMuted}>
            —
          </Text>
        )}

        {change !== null && (
          <XStack alignItems="center" gap="$1.5">
            <Text fontSize={16} color={isPositive ? Colors.neonGreen : Colors.coralRed}>
              {isPositive ? '▲' : '▼'}
            </Text>
            <StatusBadge
              label={`${isPositive ? '+' : ''}${change.toFixed(2)}%`}
              variant={isPositive ? 'positive' : 'negative'}
              size="sm"
            />
          </XStack>
        )}
      </YStack>
    </GlassCard>
  );
}
