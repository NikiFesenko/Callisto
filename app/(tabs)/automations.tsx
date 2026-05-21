// @ts-nocheck
import { TriggerCard } from '@/src/components/automations/TriggerCard';
import { Button, Text, XStack, YStack } from '@/src/components/ui/core';
import { PageShell } from '@/src/components/ui/PageShell';
import { Colors } from '@/src/lib/constants';
import { useAutomationStore } from '@/src/store/useAutomationStore';
import React, { useState } from 'react';
import { Platform, ScrollView } from 'react-native';

type FilterTab = 'all' | 'active' | 'triggered' | 'executed';



import { useNavigate } from 'react-router-dom';

import { useWalletStore } from '@/src/store/useWalletStore';

export default function AutomationsScreen() {
  const navigate = useNavigate();
  const { connected, publicKey } = useWalletStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { automations } = useAutomationStore();

  const userAutomations = (automations || []).filter(a => a.walletAddress === publicKey);

  const filtered = userAutomations.filter((a) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return a.enabled && a.status === 'monitoring';
    if (activeFilter === 'triggered') return a.status === 'triggered';
    if (activeFilter === 'executed') return a.status === 'executed';
    return true;
  });

  const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'triggered', label: 'Triggered' },
    { key: 'executed', label: 'Executed' },
  ];

  return (
    <PageShell>
      <YStack gap="$4" paddingVertical="$4">
        {Platform.OS !== 'web' && (
          <YStack paddingHorizontal="$4" gap="$1" paddingBottom="$4">
            <Text fontSize={32} fontWeight="900" color={Colors.textPrimary} letterSpacing={-1}>Automations</Text>
            <Text fontSize={16} color={Colors.textSecondary}>Your active trading bots</Text>
          </YStack>
        )}

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2" paddingHorizontal="$4">
            {FILTERS.map((f) => (
              <Button key={f.key} size="$3" borderRadius={20}
                backgroundColor={activeFilter === f.key ? 'transparent' : Colors.bgSoft}
                borderWidth={1} borderColor={activeFilter === f.key ? 'transparent' : Colors.border}
                className={activeFilter === f.key ? 'filter-tab-active' : 'filter-tab-inactive'}
                pressStyle={{ backgroundColor: Colors.bgHover }}
                onPress={() => setActiveFilter(f.key)} accessibilityLabel={`Filter: ${f.label}`}>
                <Text fontSize={13} fontWeight="600"
                  color={activeFilter === f.key ? '#FFF' : Colors.textSecondary}>{f.label}</Text>
              </Button>
            ))}
          </XStack>
        </ScrollView>

        {/* New automation button */}
        <YStack paddingHorizontal="$4">
            <Button size="$4" backgroundColor="transparent"
              className="launch-button-premium"
              pressStyle={{ scale: 0.98 }}
              animation="quick" borderRadius={12}
              onPress={() => navigate('/create-automation')} accessibilityLabel="Create new automation">
              <XStack gap="$2" alignItems="center">
                <Text fontSize={18}>⚡</Text>
                <Text fontSize={15} fontWeight="700" color="#FFF">New Automation</Text>
              </XStack>
            </Button>
        </YStack>

        {/* Automation list */}
        <YStack paddingHorizontal="$4" gap="$3">
          {!connected ? (
            <YStack paddingTop="$8" alignItems="center" gap="$4">
              <Text fontSize={48}>🔒</Text>
              <Text fontSize={18} fontWeight="600" color={Colors.textPrimary} textAlign="center">
                Wallet Connection Required
              </Text>
              <Text fontSize={14} color={Colors.textSecondary} textAlign="center" maxWidth={300}>
                Connect your wallet to view and manage your automations.
              </Text>
            </YStack>
          ) : filtered.length > 0 ? (
            filtered.map((automation) => (
              <TriggerCard key={automation.id} automation={automation} />
            ))
          ) : (
            <YStack paddingTop="$8" alignItems="center" gap="$4">
              <Text fontSize={48}>🤖</Text>
              <Text fontSize={18} fontWeight="600" color={Colors.textPrimary} textAlign="center">
                No Automations Found
              </Text>
              <Text fontSize={14} color={Colors.textSecondary} textAlign="center" maxWidth={300}>
                Create If/Then rules that automatically execute trades when macroeconomic conditions are met.
              </Text>
            </YStack>
          )}
        </YStack>
      </YStack>
    </PageShell>
  );
}
