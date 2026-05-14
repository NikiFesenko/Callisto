// @ts-nocheck
import React from 'react';
import { YStack, XStack, Text } from '@/src/components/ui/core';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/lib/constants';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  children,
  rightAction,
}: ChartCardProps) {
  return (
    <GlassCard elevated>
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack gap="$1" flex={1}>
            <Text
              fontSize={16}
              fontWeight="600"
              color={Colors.textPrimary}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                fontSize={12}
                color={Colors.textMuted}
              >
                {subtitle}
              </Text>
            )}
          </YStack>
          {rightAction}
        </XStack>

        {children}
      </YStack>
    </GlassCard>
  );
}
