// @ts-nocheck
import React from 'react';
import { Platform } from 'react-native';
import { YStack, XStack, Text, Button, Switch } from '@/src/components/ui/core';
import { PageShell } from '@/src/components/ui/PageShell';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { useWalletStore } from '@/src/store/useWalletStore';
import { useOpenWalletModal } from '@/src/components/wallet/useOpenWalletModal';
import { useThemeStore } from '@/src/store/useThemeStore';
import { Colors } from '@/src/lib/constants';
import { truncateAddress } from '@/src/lib/formatters';



function SettingsRow({ label, children, accessibilityLabel: al }: { label: string; children: React.ReactNode; accessibilityLabel?: string }) {
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical="$3"
      paddingHorizontal="$3" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}
      accessibilityLabel={al || label}>
      <Text fontSize={15} color={Colors.textPrimary}>{label}</Text>
      {children}
    </XStack>
  );
}

export default function SettingsScreen() {
  const { connected, publicKey, walletName, disconnect } = useWalletStore();
  const openWalletModal = useOpenWalletModal();
  const { theme, notificationsEnabled, setTheme, toggleNotifications, rpcEndpoint } = useThemeStore();

  return (
    <PageShell>
      <YStack gap="$4" paddingVertical="$4">
        {Platform.OS !== 'web' && (
          <YStack paddingHorizontal="$4" gap="$1" paddingBottom="$4">
            <Text fontSize={32} fontWeight="900" color={Colors.textPrimary} letterSpacing={-1}>Settings</Text>
            <Text fontSize={16} color={Colors.textSecondary}>App configuration</Text>
          </YStack>
        )}

        {/* Wallet Section */}
        <YStack paddingHorizontal="$4">
          <GlassCard elevated padding="$0">
            <YStack padding="$3" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}>
              <Text fontSize={14} fontWeight="600" color={Colors.textSecondary} textTransform="uppercase" letterSpacing={0.5}>Wallet</Text>
            </YStack>
            {connected && publicKey ? (
              <>
                <SettingsRow label="Provider">
                  <Text fontFamily="$mono" fontSize={13} color={Colors.indigo}>{walletName || 'Unknown'}</Text>
                </SettingsRow>
                <SettingsRow label="Address">
                  <Text fontFamily="$mono" fontSize={13} color={Colors.neonGreen}>{truncateAddress(publicKey, 8)}</Text>
                </SettingsRow>
                <YStack padding="$3">
                  <Button size="$3" backgroundColor="transparent" borderWidth={1} borderColor={Colors.coralRed}
                    pressStyle={{ backgroundColor: Colors.coralRedGlow }} onPress={disconnect} accessibilityLabel="Disconnect wallet">
                    <Text color={Colors.coralRed} fontWeight="600">Disconnect Wallet</Text>
                  </Button>
                </YStack>
              </>
            ) : (
              <YStack padding="$4" alignItems="center" gap="$2">
                <Text fontSize={14} color={Colors.textMuted}>No wallet connected</Text>
                <Button size="$3" backgroundColor={Colors.indigo}
                  pressStyle={{ backgroundColor: Colors.violet }}
                  borderRadius={10} onPress={openWalletModal}
                  accessibilityLabel="Connect wallet from settings">
                  <Text fontSize={13} fontWeight="600" color="#FFF">Connect Wallet</Text>
                </Button>
              </YStack>
            )}
          </GlassCard>
        </YStack>

        {/* Preferences */}
        <YStack paddingHorizontal="$4">
          <GlassCard elevated padding="$0">
            <YStack padding="$3" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}>
              <Text fontSize={14} fontWeight="600" color={Colors.textSecondary} textTransform="uppercase" letterSpacing={0.5}>Preferences</Text>
            </YStack>
            <SettingsRow label="Dark Mode" accessibilityLabel="Toggle dark mode">
              <Switch 
                value={theme === 'dark'}
                onValueChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                trackColor={{ false: Colors.bgElevated, true: Colors.neonGreenDim }}
                thumbColor={Colors.textPrimary}
              />
            </SettingsRow>
            <SettingsRow label="Notifications" accessibilityLabel="Toggle notifications">
              <Switch 
                value={notificationsEnabled} 
                onValueChange={toggleNotifications}
                trackColor={{ false: Colors.bgElevated, true: Colors.neonGreenDim }}
                thumbColor={Colors.textPrimary}
              />
            </SettingsRow>
          </GlassCard>
        </YStack>

        {/* Network */}
        <YStack paddingHorizontal="$4">
          <GlassCard elevated padding="$0">
            <YStack padding="$3" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}>
              <Text fontSize={14} fontWeight="600" color={Colors.textSecondary} textTransform="uppercase" letterSpacing={0.5}>Network</Text>
            </YStack>
            <SettingsRow label="Solana RPC">
              <Text fontFamily="$mono" fontSize={11} color={Colors.textSecondary} maxWidth={160} numberOfLines={1}>{rpcEndpoint}</Text>
            </SettingsRow>
            <SettingsRow label="Slippage Protection">
              <Text fontFamily="$mono" fontSize={13} color={Colors.neonGreen}>1.0% max</Text>
            </SettingsRow>
          </GlassCard>
        </YStack>

        {/* About */}
        <YStack paddingHorizontal="$4">
          <GlassCard elevated padding="$0">
            <YStack padding="$3" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}>
              <Text fontSize={14} fontWeight="600" color={Colors.textSecondary} textTransform="uppercase" letterSpacing={0.5}>About</Text>
            </YStack>
            <SettingsRow label="Version">
              <Text fontFamily="$mono" fontSize={13} color={Colors.textSecondary}>1.0.0</Text>
            </SettingsRow>
            <SettingsRow label="Platform">
              <Text fontFamily="$mono" fontSize={13} color={Colors.textSecondary}>Solana Mainnet</Text>
            </SettingsRow>
          </GlassCard>
        </YStack>

        {/* Security notice */}
        <YStack paddingHorizontal="$4">
          <GlassCard padding="$3" glow="green">
            <YStack gap="$2">
              <Text fontSize={13} fontWeight="600" color={Colors.neonGreen}>🔒 Security</Text>
              <Text fontSize={12} color={Colors.textSecondary} lineHeight={18}>
                Colisto never stores or accesses your private keys. All transactions are signed
                through your connected wallet provider. API keys are secured via serverless proxies.
              </Text>
            </YStack>
          </GlassCard>
        </YStack>
      </YStack>
    </PageShell>
  );
}
