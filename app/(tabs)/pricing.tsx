// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { PageShell } from '@/src/components/ui/PageShell';
import { Colors } from '@/src/lib/constants';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { XStack, YStack, Text, Button } from '@/src/components/ui/core';

type Toast = {
  id: number;
  message: string;
  subtitle: string;
  type: 'success' | 'info';
};

function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const icon = toast.type === 'success' ? '✨' : '📬';
  const borderColor = toast.type === 'success' ? Colors.neonGreen : Colors.indigo;
  const glowColor = toast.type === 'success'
    ? 'rgba(0, 255, 163, 0.25)'
    : 'rgba(99, 102, 241, 0.25)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 14,
        backgroundColor: 'var(--color-bg-elevated, #131720)',
        border: `1px solid ${borderColor}`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 20px ${glowColor}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        minWidth: 300,
        maxWidth: 380,
        animation: 'slideInToast 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary, #FAFAFA)', marginBottom: 2 }}>
          {toast.message}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #A1A1AA)', lineHeight: 1.5 }}>
          {toast.subtitle}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted, #6B7280)',
          fontSize: 18,
          lineHeight: 1,
          padding: 2,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function PricingScreen() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [upgradingPro, setUpgradingPro] = useState(false);
  const [activePlan, setActivePlan] = useState<'basic' | 'pro' | 'institutional'>('basic');

  const addToast = (message: string, subtitle: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, subtitle, type }]);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpgradePro = async () => {
    if (activePlan === 'pro') {
      addToast('Already on Pro!', 'You already have access to all Pro features.', 'info');
      return;
    }
    setUpgradingPro(true);
    // Simulate async checkout redirect
    await new Promise((r) => setTimeout(r, 1200));
    setUpgradingPro(false);
    setActivePlan('pro');
    addToast('Welcome to Pro! 🎉', 'Your plan has been upgraded. Unlimited automations are now active.', 'success');
  };

  const handleContactSales = () => {
    window.open('mailto:sales@colisto.io?subject=Institutional%20Plan%20Inquiry&body=Hi%20Colisto%20team%2C%20I%27m%20interested%20in%20the%20Institutional%20plan.', '_blank');
    addToast('Email client opened', 'Reach us at sales@colisto.io — we typically respond within 1 business day.', 'info');
  };

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
          {/* Basic Tier */}
          <GlassCard padding="$6" width={320} elevated style={activePlan === 'basic' ? { borderColor: Colors.neonGreenDim, borderWidth: 1 } as any : {}}>
            <YStack gap="$4" flex={1}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={20} fontWeight="700" color={Colors.textPrimary}>Basic</Text>
                {activePlan === 'basic' && (
                  <YStack backgroundColor="rgba(0, 255, 163, 0.15)" paddingHorizontal="$2" paddingVertical={4} borderRadius={12}>
                    <Text fontSize={10} color={Colors.neonGreen} fontWeight="700">CURRENT PLAN</Text>
                  </YStack>
                )}
              </XStack>
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

              <Button
                marginTop="$6"
                variant="secondary"
                size="$4"
                onPress={() => activePlan !== 'basic' && setActivePlan('basic')}
                style={{ opacity: activePlan === 'basic' ? 0.6 : 1 } as any}
              >
                <Text color={Colors.textPrimary} fontWeight="600">
                  {activePlan === 'basic' ? 'Current Plan' : 'Downgrade to Basic'}
                </Text>
              </Button>
            </YStack>
          </GlassCard>

          {/* Pro Tier */}
          <GlassCard
            padding="$6"
            width={320}
            elevated
            style={{
              borderColor: activePlan === 'pro' ? Colors.neonGreenDim : Colors.indigo,
              borderWidth: 2,
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 40px rgba(99, 102, 241, 0.3)`,
            } as any}
          >
            <YStack gap="$4" flex={1}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={20} fontWeight="700" color={Colors.indigo}>Pro</Text>
                <YStack backgroundColor="rgba(99, 102, 241, 0.2)" paddingHorizontal="$2" paddingVertical={4} borderRadius={12}>
                  <Text fontSize={10} color={Colors.indigo} fontWeight="700">
                    {activePlan === 'pro' ? 'ACTIVE ✓' : 'MOST POPULAR'}
                  </Text>
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

              <Button
                marginTop="$6"
                variant="primary"
                size="$4"
                onPress={handleUpgradePro}
                style={{ opacity: upgradingPro ? 0.8 : 1 } as any}
              >
                {upgradingPro ? (
                  <XStack gap="$2" alignItems="center">
                    <div style={{ width: 16, height: 16, borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', animation: 'spin 1s linear infinite' }} />
                    <Text color="#FFF" fontWeight="700">Processing…</Text>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </XStack>
                ) : (
                  <Text color="#FFF" fontWeight="700">
                    {activePlan === 'pro' ? '✓ Pro Active' : 'Upgrade to Pro →'}
                  </Text>
                )}
              </Button>
            </YStack>
          </GlassCard>

          {/* Institutional Tier */}
          <GlassCard padding="$6" width={320} elevated style={activePlan === 'institutional' ? { borderColor: Colors.violet, borderWidth: 2 } as any : {}}>
            <YStack gap="$4" flex={1}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={20} fontWeight="700" color={Colors.textPrimary}>Institutional</Text>
                {activePlan === 'institutional' && (
                  <YStack backgroundColor="rgba(139, 92, 246, 0.2)" paddingHorizontal="$2" paddingVertical={4} borderRadius={12}>
                    <Text fontSize={10} color={Colors.violet} fontWeight="700">ACTIVE ✓</Text>
                  </YStack>
                )}
              </XStack>
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

              <Button marginTop="$6" variant="secondary" size="$4" onPress={handleContactSales}>
                <Text color={Colors.textPrimary} fontWeight="600">Contact Sales →</Text>
              </Button>
            </YStack>
          </GlassCard>
        </XStack>

        {/* FAQ / Trust section */}
        <YStack alignItems="center" marginTop="$8" gap="$2">
          <Text fontSize={13} color={Colors.textMuted} style={{ textAlign: 'center' } as any}>
            🔒 Secure payments · Cancel anytime · No hidden fees
          </Text>
          <Text fontSize={12} color={Colors.textMuted} style={{ textAlign: 'center' } as any}>
            Questions? Email <span style={{ color: Colors.indigo }}>support@colisto.io</span>
          </Text>
        </YStack>
      </ScrollView>

      {/* Toast layer */}
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </PageShell>
  );
}
