// @ts-nocheck
import React from 'react';
import { YStack, XStack, Text, Switch, Button } from 'tamagui';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { Colors } from '@/src/lib/constants';
import { formatRelativeTime } from '@/src/lib/formatters';
import type { Automation, AutomationStatus } from '@/src/store/useAutomationStore';
import { useAutomationStore } from '@/src/store/useAutomationStore';

const INDICATOR_LABELS: Record<string, string> = {
  CPI: 'US CPI', CORE_CPI: 'Core CPI', FED_FUNDS: 'Fed Rate',
  M2: 'M2 Supply', GDP: 'GDP', UNEMPLOYMENT: 'Unemployment',
};

const STATUS_VARIANTS: Record<AutomationStatus, 'neutral' | 'info' | 'warning' | 'positive' | 'negative'> = {
  idle: 'neutral', monitoring: 'info', triggered: 'warning', executed: 'positive', failed: 'negative',
};

export function TriggerCard({ automation }: { automation: Automation }) {
  const { toggleAutomation, removeAutomation } = useAutomationStore();
  const conditionText = `IF ${INDICATOR_LABELS[automation.condition.indicator] || automation.condition.indicator} ${automation.condition.operator} ${automation.condition.threshold}`;
  const actionText = `THEN Swap ${automation.action.amount} ${automation.action.inputSymbol} → ${automation.action.outputSymbol}`;
  const glowVal = automation.status === 'executed' ? 'green' as const : automation.status === 'failed' ? 'red' as const : undefined;

  return (
    <GlassCard glow={glowVal} pressStyle={{ scale: 0.99 }} animation="quick"
      accessibilityLabel={`Automation: ${automation.name}. ${conditionText}. ${actionText}`}>
      <YStack gap="$2.5">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center" flex={1}>
            <Text fontSize={15} fontWeight="600" color={Colors.textPrimary} numberOfLines={1}>{automation.name}</Text>
            <StatusBadge label={automation.status.toUpperCase()} variant={STATUS_VARIANTS[automation.status]} size="sm" />
          </XStack>
          <Switch size="$2" checked={automation.enabled} onCheckedChange={() => toggleAutomation(automation.id)}
            backgroundColor={automation.enabled ? Colors.neonGreenDim : Colors.bgElevated} accessibilityLabel={`Toggle ${automation.name}`}>
            <Switch.Thumb animation="quick" backgroundColor={Colors.textPrimary} />
          </Switch>
        </XStack>
        <YStack backgroundColor={Colors.bgDeep} padding="$2.5" borderRadius={10} gap="$1">
          <Text fontSize={13} fontFamily="$mono" fontWeight="600" color={Colors.indigo}>{conditionText}</Text>
          <Text fontSize={13} fontFamily="$mono" fontWeight="600" color={Colors.neonGreen}>{actionText}</Text>
        </YStack>
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap={2}>
            {automation.lastTriggered && <Text fontSize={11} color={Colors.textMuted}>Last: {formatRelativeTime(new Date(automation.lastTriggered))}</Text>}
          </YStack>
          <Button size="$2" backgroundColor="transparent" pressStyle={{ backgroundColor: Colors.coralRedGlow }}
            onPress={() => removeAutomation(automation.id)} accessibilityLabel={`Delete ${automation.name}`}>
            <Text fontSize={12} color={Colors.coralRed}>Delete</Text>
          </Button>
        </XStack>
      </YStack>
    </GlassCard>
  );
}
