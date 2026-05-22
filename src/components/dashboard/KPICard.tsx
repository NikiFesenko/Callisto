// @ts-nocheck
import React from 'react';
import { YStack, XStack, Text } from '@/src/components/ui/core';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { AnimatedCounter } from '@/src/components/ui/AnimatedCounter';
import { Skeleton } from '@/src/components/ui/Skeleton';

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
  title, value, change,
  prefix = '', suffix = '',
  decimals = 2, isLoading = false, compact = false,
}: KPICardProps) {
  const isPositive = change !== null && change >= 0;

  if (isLoading) {
    return (
      <div style={{
        minWidth: compact ? 150 : 170,
        flex: 1,
        padding: 16,
        borderRadius: 14,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="title" width="50%" />
        <Skeleton variant="text" width="40%" />
      </div>
    );
  }

  return (
    <div
      style={{
        minWidth: compact ? 150 : 170,
        flex: 1,
        padding: 16,
        borderRadius: 14,
        background: 'var(--bg-card)',
        border: `1px solid ${change === null ? 'var(--border-default)' : isPositive ? 'rgba(0,255,163,0.2)' : 'rgba(244,63,94,0.2)'}`,
        display: 'flex', flexDirection: 'column', gap: 8,
        boxShadow: change === null ? 'var(--shadow-card)' : isPositive ? 'var(--shadow-glow-green)' : '0 0 20px rgba(244,63,94,0.08)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </span>

      {value !== null ? (
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          fontSize={compact ? 20 : 26}
          fontWeight="800"
          color="var(--text-primary)"
        />
      ) : (
        <span style={{ fontSize: 26, fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)' }}>—</span>
      )}

      {change !== null && (
        <XStack alignItems="center" gap="$1">
          <span style={{ fontSize: 13, color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
            {isPositive ? '▲' : '▼'}
          </span>
          <StatusBadge
            label={`${isPositive ? '+' : ''}${change.toFixed(2)}%`}
            variant={isPositive ? 'positive' : 'negative'}
            size="sm"
          />
        </XStack>
      )}
    </div>
  );
}
