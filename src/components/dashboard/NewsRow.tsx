// @ts-nocheck
/**
 * NewsRow — Scrollable crypto news feed card for the dashboard.
 * Displays real headlines with sentiment color coding, source, time ago,
 * and opens original article on press.
 */
import React from 'react';
import { YStack, XStack, Text } from '@/src/components/ui/core';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useCryptoNews, timeAgo, type NewsItem } from '@/src/api/news';
import { Colors } from '@/src/lib/constants';

const SENTIMENT_COLOR = {
  positive: Colors.neonGreen,
  negative: Colors.coralRed,
  neutral: Colors.textMuted,
};

const SENTIMENT_DOT = {
  positive: '▲',
  negative: '▼',
  neutral: '●',
};

function openUrl(url: string) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function NewsCard({ item }: { item: NewsItem }) {
  const sentiment = item.sentiment || 'neutral';
  const sentColor = SENTIMENT_COLOR[sentiment];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 transition-all duration-200 hover:-translate-y-1"
      style={{
        textDecoration: 'none',
        display: 'block',
        cursor: 'pointer',
      }}
      aria-label={item.title}
    >
      <YStack
        width={260}
        backgroundColor={Colors.bgElevated}
        borderRadius={12}
        padding="$3"
        gap="$2"
        borderWidth={1}
        borderColor={Colors.borderSubtle}
        style={{
          transition: 'border-color 0.2s, box-shadow 0.2s',
        } as any}
      >
        {/* Header row */}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$1.5" alignItems="center" flex={1}>
            <Text fontSize={10} color={Colors.textMuted} numberOfLines={1}>
              {item.source}
            </Text>
            {item.currencies && item.currencies.length > 0 && (
              <XStack gap="$1">
                {item.currencies.slice(0, 2).map(c => (
                  <YStack
                    key={c}
                    paddingHorizontal={5}
                    paddingVertical={1}
                    borderRadius={4}
                    backgroundColor={Colors.bgHover}
                  >
                    <Text fontSize={9} fontWeight="700" color={Colors.indigo}>{c}</Text>
                  </YStack>
                ))}
              </XStack>
            )}
          </XStack>
          <XStack gap="$1" alignItems="center">
            <Text fontSize={10} color={sentColor}>{SENTIMENT_DOT[sentiment]}</Text>
            <Text fontSize={10} color={Colors.textMuted}>{timeAgo(item.publishedAt)}</Text>
          </XStack>
        </XStack>

        {/* Headline */}
        <Text
          fontSize={13}
          fontWeight="500"
          color={Colors.textPrimary}
          numberOfLines={3}
          lineHeight={18}
        >
          {item.title}
        </Text>

        {/* Read more hint */}
        <Text fontSize={10} color={Colors.indigo}>Read more →</Text>
      </YStack>
    </a>
  );
}

export function NewsRow() {
  const { data: news = [], isLoading } = useCryptoNews();

  return (
    <GlassCard elevated padding="$0">
      <YStack>
        {/* Header */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          padding="$3"
          borderBottomWidth={1}
          borderBottomColor={Colors.borderSubtle}
        >
          <XStack gap="$2" alignItems="center">
            <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>
              Crypto News
            </Text>
            <YStack
              width={6}
              height={6}
              borderRadius={3}
              backgroundColor={Colors.neonGreen}
              style={{
                boxShadow: `0 0 6px ${Colors.neonGreen}`,
                animation: 'pulse 2s infinite',
              } as any}
            />
          </XStack>
          <StatusBadge label="Live" variant="positive" size="sm" />
        </XStack>

        {/* Scrollable cards */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div style={{ display: 'flex', padding: '12px', gap: '12px' }}>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <YStack key={i} width={260} gap="$2">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="text" width="60%" />
                  </YStack>
                ))
              : news.map(item => (
                  <NewsCard key={item.id} item={item} />
                ))}
          </div>
        </div>
      </YStack>
    </GlassCard>
  );
}
