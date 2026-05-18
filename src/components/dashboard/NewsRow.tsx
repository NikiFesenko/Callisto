// @ts-nocheck
/**
 * NewsRow — Scrollable crypto news feed card for the dashboard.
 * Redesigned as a modern vertical feed to avoid truncation and provide a premium reading experience.
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

function NewsCard({ item }: { item: NewsItem }) {
  const sentiment = item.sentiment || 'neutral';
  const sentColor = SENTIMENT_COLOR[sentiment];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
      style={{ textDecoration: 'none', cursor: 'pointer' }}
      aria-label={item.title}
    >
      <div
        className="flex flex-col p-4 gap-3 rounded-2xl border bg-[#111827]/40 transition-all duration-300"
        style={{
          borderColor: Colors.borderSubtle,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(26, 34, 53, 0.8)';
          e.currentTarget.style.borderColor = Colors.border;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.4)';
          e.currentTarget.style.borderColor = Colors.borderSubtle;
          e.currentTarget.style.transform = 'translateY(0px)';
        }}
      >
        {/* Header row */}
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row items-center gap-2">
            <span className="text-[11px] font-medium text-[#64748B]">
              {item.source}
            </span>
            {item.currencies && item.currencies.length > 0 && (
              <div className="flex flex-row gap-1.5">
                {item.currencies.slice(0, 2).map(c => (
                  <span
                    key={c}
                    className="text-[9px] font-bold text-[#6366F1] bg-[#1A2235] px-1.5 py-0.5 rounded uppercase tracking-wide"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-row items-center gap-1.5">
            <span className="text-[10px]" style={{ color: sentColor }}>
              {SENTIMENT_DOT[sentiment]}
            </span>
            <span className="text-[11px] text-[#64748B]">
              {timeAgo(item.publishedAt)}
            </span>
          </div>
        </div>

        {/* Headline */}
        <span className="text-[14px] font-medium text-[#E2E8F0] leading-[22px] group-hover:text-white transition-colors">
          {item.title}
        </span>
      </div>
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
          padding="$4"
          borderBottomWidth={1}
          borderBottomColor={Colors.borderSubtle}
        >
          <XStack gap="$2" alignItems="center">
            <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>
              Market Intelligence
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
          <StatusBadge label="Live Feed" variant="positive" size="sm" />
        </XStack>

        {/* Vertical Scrollable Feed */}
        <div
          className="flex flex-col p-4 gap-3 overflow-y-auto"
          style={{
            maxHeight: '460px',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE
          }}
        >
          <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>
          
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col p-4 gap-3 rounded-2xl border"
                  style={{ borderColor: Colors.borderSubtle, backgroundColor: 'rgba(17, 24, 39, 0.4)' }}
                >
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                </div>
              ))
            : news.map((item, i) => (
                <NewsCard key={`${item.id}-${i}`} item={item} />
              ))}
              
          {!isLoading && news.length === 0 && (
            <div className="flex py-8 justify-center items-center">
              <span className="text-[#64748B] text-sm">No recent news available.</span>
            </div>
          )}
        </div>
      </YStack>
    </GlassCard>
  );
}
