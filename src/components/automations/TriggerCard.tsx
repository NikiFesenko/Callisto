// @ts-nocheck
import React from 'react';
import { YStack, XStack, Text, Switch, Button } from '@/src/components/ui/core';
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
    <GlassCard glow={glowVal} className="trigger-card-premium" pressStyle={{ scale: 0.99 }} animation="quick"
      accessibilityLabel={`Automation: ${automation.name}. ${conditionText}. ${actionText}`}>
      <YStack gap="$2.5">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center" flex={1}>
            <Text fontSize={15} fontWeight="600" color={Colors.textPrimary} numberOfLines={1}>{automation.name}</Text>
            <StatusBadge label={automation.status.toUpperCase()} variant={STATUS_VARIANTS[automation.status]} size="sm" />
          </XStack>
          <Switch size="$2" value={automation.enabled} onValueChange={() => toggleAutomation(automation.id)}
            trackColor={{ true: Colors.neonGreenDim, false: Colors.bgElevated }} thumbColor={Colors.textPrimary}
            accessibilityLabel={`Toggle ${automation.name}`} />
        </XStack>
        <YStack backgroundColor={Colors.bgDeep} padding="$3" borderRadius={12} gap="$2" borderWidth={1} borderColor={Colors.borderSubtle}>
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$2" alignItems="center">
              <Text fontSize={16}>{automation.action.inputSymbol === 'USDC' ? '↗️' : '↘️'}</Text>
              <Text fontSize={12} fontWeight="700" color={automation.action.inputSymbol === 'USDC' ? Colors.neonGreen : Colors.coralRed}>
                {automation.action.inputSymbol === 'USDC' ? 'LONG' : 'SHORT'}
              </Text>
            </XStack>
            <YStack backgroundColor={Colors.bgHover} paddingHorizontal="$2" paddingVertical="$1" borderRadius={4}>
              <Text fontSize={10} color={Colors.textSecondary}>Max Slippage: {automation.action.slippageBps / 100}%</Text>
            </YStack>
          </XStack>
          
          <YStack gap="$1" marginTop="$1">
            <Text fontSize={12} fontFamily="$mono" fontWeight="600" color={Colors.textPrimary}>
              <Text color={Colors.textMuted}>IF</Text> {INDICATOR_LABELS[automation.condition.indicator] || automation.condition.indicator} {automation.condition.operator} {automation.condition.threshold}
            </Text>
            <Text fontSize={12} fontFamily="$mono" fontWeight="600" color={Colors.textPrimary}>
              <Text color={Colors.textMuted}>THEN</Text> Swap {automation.action.amount} {automation.action.inputSymbol} → {automation.action.outputSymbol}
            </Text>
          </YStack>
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
