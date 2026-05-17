// @ts-nocheck
import React from 'react';

import { YStack, XStack, Text } from '@/src/components/ui/core';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { useMacroCalendar, type MacroEvent } from '@/src/api/tradingEconomics';
import { Colors } from '@/src/lib/constants';

const importanceColors = {
  High: Colors.coralRed,
  Medium: '#FBB724',
  Low: Colors.textMuted,
};

function EventRow({ event }: { event: MacroEvent }) {
  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <XStack
      gap="$3"
      paddingVertical="$2"
      borderBottomWidth={1}
      borderBottomColor={Colors.borderSubtle}
      alignItems="center"
      accessibilityLabel={`${event.event} on ${formattedDate}`}
    >
      {/* Date */}
      <YStack width={48} alignItems="center">
        <Text fontSize={11} fontWeight="700" color={Colors.textPrimary}>
          {formattedDate}
        </Text>
      </YStack>

      {/* Importance dot */}
      <YStack
        width={6}
        height={6}
        borderRadius={3}
        backgroundColor={importanceColors[event.importance]}
      />

      {/* Event info */}
      <YStack flex={1} gap={2}>
        <Text fontSize={13} fontWeight="500" color={Colors.textPrimary} numberOfLines={1}>
          {event.event}
        </Text>
        <XStack gap="$2">
          <Text fontSize={11} color={Colors.textMuted}>
            {event.country}
          </Text>
          {event.forecast !== null && (
            <Text fontSize={11} fontFamily="$mono" color={Colors.textSecondary}>
              Exp: {event.forecast}
            </Text>
          )}
          {event.previous !== null && (
            <Text fontSize={11} fontFamily="$mono" color={Colors.textMuted}>
              Prev: {event.previous}
            </Text>
          )}
        </XStack>
      </YStack>

      {/* Actual value */}
      {event.actual !== null ? (
        <StatusBadge
          label={event.actual.toString()}
          variant={
            event.forecast !== null
              ? event.actual > event.forecast
                ? 'positive'
                : event.actual < event.forecast
                ? 'negative'
                : 'neutral'
              : 'info'
          }
          size="sm"
        />
      ) : (
        <StatusBadge label="Upcoming" variant="info" size="sm" />
      )}
    </XStack>
  );
}

export function MacroOverlay() {
  const { data: events = [], isLoading } = useMacroCalendar();

  return (
    <GlassCard elevated>
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>
            Macro Calendar
          </Text>
          <StatusBadge label={`${events.length} Events`} variant="info" size="sm" />
        </XStack>

        <YStack>
          {isLoading ? (
            <YStack padding="$4" alignItems="center">
              <Text color={Colors.textMuted}>Loading events...</Text>
            </YStack>
          ) : events.length > 0 ? (
            events.slice(0, 5).map((event, i) => (
              <EventRow key={`${event.date}-${event.event}-${i}`} event={event} />
            ))
          ) : (
            <YStack padding="$4" alignItems="center">
              <Text color={Colors.textMuted}>No upcoming events</Text>
            </YStack>
          )}
        </YStack>
      </YStack>
    </GlassCard>
  );
}
