// @ts-nocheck
import React from 'react';
import { Platform } from 'react-native';
import { YStack, XStack, Text, Button, Spinner } from '@/src/components/ui/core';
import { useWalletStore } from '@/src/store/useWalletStore';
import { useOpenWalletModal } from '@/src/components/wallet/useOpenWalletModal';
import { Colors } from '@/src/lib/constants';
import { truncateAddress } from '@/src/lib/formatters';
import { GlassCard } from '@/src/components/ui/GlassCard';

export function ConnectButton() {
  const {
    connected, connecting, publicKey, walletName,
    disconnect, error,
  } = useWalletStore();
  const openWalletModal = useOpenWalletModal();

  // Connected state
  if (connected && publicKey) {
    return (
      <GlassCard padding="$3" glow="green">
        <XStack alignItems="center" gap="$3">
          {/* Green connected indicator */}
          <YStack
            width={10} height={10} borderRadius={5}
            backgroundColor={Colors.neonGreen}
            shadowColor={Colors.neonGreen}
            shadowOffset={{ width: 0, height: 0 }}
            shadowOpacity={0.5}
            shadowRadius={4}
          />

          <YStack flex={1}>
            <Text fontSize={11} color={Colors.textMuted}>
              Connected via {walletName || 'Wallet'}
            </Text>
            <Text fontFamily="$mono" fontSize={14} color={Colors.textPrimary} fontWeight="600">
              {truncateAddress(publicKey, 6)}
            </Text>
          </YStack>

          <Button
            size="$2"
            backgroundColor="transparent"
            borderWidth={1}
            borderColor={Colors.coralRed}
            pressStyle={{ backgroundColor: Colors.coralRedGlow }}
            onPress={disconnect}
            accessibilityLabel="Disconnect wallet"
          >
            <Text fontSize={12} color={Colors.coralRed} fontWeight="600">
              Disconnect
            </Text>
          </Button>
        </XStack>
      </GlassCard>
    );
  }

  // Disconnected state — single button that opens the wallet selection modal
  return (
    <YStack gap="$3">
      <Button
        size="$4"
        backgroundColor={Colors.indigo}
        pressStyle={{ backgroundColor: Colors.violet, scale: 0.98 }}
        animation="quick"
        borderRadius={12}
        onPress={openWalletModal}
        disabled={connecting}
        accessibilityLabel="Connect wallet"
      >
        <XStack alignItems="center" gap="$2">
          {connecting ? (
            <Spinner size="small" color="#FFF" />
          ) : (
            <Text fontSize={18}>🔗</Text>
          )}
          <Text fontSize={15} fontWeight="600" color="#FFF">
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Text>
        </XStack>
      </Button>

      {error && (
        <GlassCard padding="$2" glow="red">
          <Text fontSize={12} color={Colors.coralRed} textAlign="center">
            {error}
          </Text>
        </GlassCard>
      )}
    </YStack>
  );
}
