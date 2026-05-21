// @ts-nocheck
import React from 'react';
import { ScrollView } from 'react-native';
import { PageShell } from '@/src/components/ui/PageShell';
import { Colors } from '@/src/lib/constants';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { XStack, YStack, Text, Button } from '@/src/components/ui/core';

export default function PricingScreen() {
  return (
    <PageShell>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 } as any}>
        {/* Header */}
        <YStack alignItems="center" gap="$3" marginBottom="$8">
          <Text fontSize={48} fontWeight="900" color={Colors.textPrimary} style={{ textAlign: 'center', letterSpacing: -2 } as any}>
            Simple, Transparent Pricing
          </Text>
          <Text fontSize={16} color={Colors.textSecondary} style={{ textAlign: 'center', maxWidth: 600 } as any}>
            Unlock advanced macro-trading automations, real-time analytics, and premium alerts. Cancel anytime.
          </Text>
        </YStack>

        {/* Pricing Cards */}
        <XStack flexWrap="wrap" justifyContent="center" gap="$6">
          {/* Free Tier */}
          <GlassCard padding="$6" width={320} elevated>
            <YStack gap="$4" flex={1}>
              <Text fontSize={20} fontWeight="700" color={Colors.textPrimary}>Basic</Text>
              <XStack alignItems="flex-end" gap="$1">
                <Text fontSize={36} fontWeight="800" color={Colors.textPrimary}>$0</Text>
                <Text fontSize={16} color={Colors.textMuted} fontWeight="500" style={{ paddingBottom: 6 } as any}>/mo</Text>
              </XStack>
              <Text fontSize={14} color={Colors.textSecondary} marginBottom="$4">Perfect for getting started with crypto macro-tracking.</Text>
              
              <YStack gap="$3" flex={1}>
                {['Live Crypto Prices', 'Basic Macro Indicators', '1 Automation Rule', 'Community Support'].map((feature, i) => (
                  <XStack key={i} alignItems="center" gap="$2">
                    <Text color={Colors.neonGreen}>✓</Text>
                    <Text fontSize={14} color={Colors.textPrimary}>{feature}</Text>
                  </XStack>
                ))}
              </YStack>

              <Button marginTop="$6" variant="secondary" size="$4">
                <Text color={Colors.textPrimary} fontWeight="600">Current Plan</Text>
              </Button>
            </YStack>
          </GlassCard>

          {/* Pro Tier */}
          <GlassCard padding="$6" width={320} elevated style={{ borderColor: Colors.indigo, borderWidth: 2 } as any}>
            <YStack gap="$4" flex={1}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={20} fontWeight="700" color={Colors.indigo}>Pro</Text>
                <YStack backgroundColor="rgba(99, 102, 241, 0.2)" paddingHorizontal="$2" paddingVertical={4} borderRadius={12}>
                  <Text fontSize={10} color={Colors.indigo} fontWeight="700">MOST POPULAR</Text>
                </YStack>
              </XStack>
              <XStack alignItems="flex-end" gap="$1">
                <Text fontSize={36} fontWeight="800" color={Colors.textPrimary}>$29</Text>
                <Text fontSize={16} color={Colors.textMuted} fontWeight="500" style={{ paddingBottom: 6 } as any}>/mo</Text>
              </XStack>
              <Text fontSize={14} color={Colors.textSecondary} marginBottom="$4">Advanced tools for serious macro traders.</Text>
              
              <YStack gap="$3" flex={1}>
                {['Everything in Basic', 'Unlimited Automations', 'Real-time On-Chain Data', 'Priority Alert Execution', 'API Access'].map((feature, i) => (
                  <XStack key={i} alignItems="center" gap="$2">
                    <Text color={Colors.neonGreen}>✓</Text>
                    <Text fontSize={14} color={Colors.textPrimary}>{feature}</Text>
                  </XStack>
                ))}
              </YStack>

              <Button marginTop="$6" variant="primary" size="$4">
                <Text color="#FFF" fontWeight="700">Upgrade to Pro</Text>
              </Button>
            </YStack>
          </GlassCard>

          {/* Institutional Tier */}
          <GlassCard padding="$6" width={320} elevated>
            <YStack gap="$4" flex={1}>
              <Text fontSize={20} fontWeight="700" color={Colors.textPrimary}>Institutional</Text>
              <XStack alignItems="flex-end" gap="$1">
                <Text fontSize={36} fontWeight="800" color={Colors.textPrimary}>$199</Text>
                <Text fontSize={16} color={Colors.textMuted} fontWeight="500" style={{ paddingBottom: 6 } as any}>/mo</Text>
              </XStack>
              <Text fontSize={14} color={Colors.textSecondary} marginBottom="$4">Enterprise-grade infrastructure for funds.</Text>
              
              <YStack gap="$3" flex={1}>
                {['Everything in Pro', 'Custom Wallet Integration', 'Dedicated Account Manager', 'Sub-millisecond latency', 'SLA Guarantee'].map((feature, i) => (
                  <XStack key={i} alignItems="center" gap="$2">
                    <Text color={Colors.neonGreen}>✓</Text>
                    <Text fontSize={14} color={Colors.textPrimary}>{feature}</Text>
                  </XStack>
                ))}
              </YStack>

              <Button marginTop="$6" variant="secondary" size="$4">
                <Text color={Colors.textPrimary} fontWeight="600">Contact Sales</Text>
              </Button>
            </YStack>
          </GlassCard>
        </XStack>
      </ScrollView>
    </PageShell>
  );
}
