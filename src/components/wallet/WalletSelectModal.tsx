// @ts-nocheck
/**
 * WalletSelectModal — renders the wallet selection modal in a SEPARATE React root.
 *
 * This is the most reliable approach for Expo web static output:
 * - A new React root is created in a div appended to document.body
 * - The modal renders in this separate root, bypassing Expo's SSR/hydration constraints
 * - The separate root is outside expo-router's control, so position:fixed works perfectly
 *
 * For native: uses React Native Modal (unchanged behavior).
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/src/store/useWalletStore';
import { Colors } from '@/src/lib/constants';

// ============================================================
// The actual modal UI — used by both web and native paths
// ============================================================

function ModalOverlay({
  onClose,
  wallets,
  onSelect,
}: {
  onClose: () => void;
  wallets: any[];
  onSelect: (name: string) => void;
}) {
  const installableWallets = wallets.filter(
    (w) => w.readyState === 'Installed' || w.readyState === 'Loadable'
  );
  const otherWallets = wallets.filter(
    (w) => w.readyState !== 'Installed' && w.readyState !== 'Loadable'
  );

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Connect Wallet</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeX}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Choose your Solana wallet to get started
        </Text>

        <ScrollView style={styles.walletList} showsVerticalScrollIndicator={false}>
          {installableWallets.length > 0 && (
            <>
              {installableWallets.map((wallet) => (
                <WalletRow
                  key={wallet.adapter.name}
                  wallet={wallet}
                  onSelect={onSelect}
                  detected
                />
              ))}
              {otherWallets.length > 0 && (
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>More options</Text>
                  <View style={styles.dividerLine} />
                </View>
              )}
            </>
          )}

          {otherWallets.map((wallet) => (
            <WalletRow
              key={wallet.adapter.name}
              wallet={wallet}
              onSelect={onSelect}
            />
          ))}

          {installableWallets.length === 0 && otherWallets.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔌</Text>
              <Text style={styles.emptyText}>No wallets detected</Text>
              <Text style={styles.emptySubtext}>
                Install Phantom or Solflare browser extension
              </Text>
            </View>
          )}
        </ScrollView>

        <Text style={styles.footer}>
          By connecting, you agree to our Terms of Service
        </Text>
      </Pressable>
    </Pressable>
  );
}

function WalletRow({
  wallet,
  onSelect,
  detected = false,
}: {
  wallet: any;
  onSelect: (name: string) => void;
  detected?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={() => onSelect(wallet.adapter.name)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.walletRow, pressed && styles.walletRowPressed]}
    >
      {wallet.adapter.icon ? (
        <Image source={{ uri: wallet.adapter.icon }} style={styles.walletIcon} resizeMode="contain" />
      ) : (
        <View style={[styles.walletIcon, styles.iconPlaceholder]}>
          <Text style={{ fontSize: 22 }}>💼</Text>
        </View>
      )}
      <View style={styles.walletInfo}>
        <Text style={styles.walletName}>{wallet.adapter.name}</Text>
        {detected ? (
          <Text style={styles.walletDetected}>● Detected</Text>
        ) : (
          <Text style={styles.walletNotInstalled}>Not installed</Text>
        )}
      </View>
      <Text style={styles.walletArrow}>›</Text>
    </Pressable>
  );
}

// ============================================================
// Web implementation — renders in the existing RN tree
// Uses a local state flag for visibility
// ============================================================

function WebWalletModal({ wallets, connected }: { wallets: any[]; connected: boolean }) {
  const [visible, setVisible] = useState(false);
  const { select } = useWallet();
  const setVisibleRef = useRef(setVisible);
  setVisibleRef.current = setVisible;

  useEffect(() => {
    useWalletStore.getState()._setModalOpener(() => {
      setVisibleRef.current(true);
    });
    return () => {
      useWalletStore.getState()._setModalOpener(null);
    };
  }, []);

  useEffect(() => {
    if (connected) setVisible(false);
  }, [connected]);

  if (!visible) return null;

  const handleSelect = (walletName: string) => {
    select(walletName as any);
    setVisible(false);
  };

  return (
    <View
      style={{
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
      }}
    >
      <ModalOverlay
        onClose={() => setVisible(false)}
        wallets={wallets}
        onSelect={handleSelect}
      />
    </View>
  );
}

// ============================================================
// Native implementation — uses React Native Modal
// ============================================================

function NativeWalletModal() {
  const { wallets, select, connected } = useWallet();
  const [visible, setVisible] = useState(false);
  const setVisibleRef = useRef(setVisible);
  setVisibleRef.current = setVisible;

  useEffect(() => {
    useWalletStore.getState()._setModalOpener(() => {
      setVisibleRef.current(true);
    });
    return () => {
      useWalletStore.getState()._setModalOpener(null);
    };
  }, []);

  useEffect(() => {
    if (connected) setVisible(false);
  }, [connected]);

  const handleSelect = (walletName: string) => {
    select(walletName as any);
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
      statusBarTranslucent
    >
      <ModalOverlay
        onClose={() => setVisible(false)}
        wallets={wallets}
        onSelect={handleSelect}
      />
    </Modal>
  );
}

// ============================================================
// Main export — picks the right implementation per platform
// ============================================================

export function WalletSelectModal() {
  if (Platform.OS === 'web') {
    return <WebWalletModalWrapper />;
  }
  return <NativeWalletModal />;
}

function WebWalletModalWrapper() {
  const { wallets, connected } = useWallet();
  return <WebWalletModal wallets={wallets} connected={connected} />;
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#0D1117',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 25px 60px rgba(0,0,0,0.9)' } as any
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.8,
          shadowRadius: 40,
          elevation: 20,
        }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  walletList: {
    maxHeight: 380,
    paddingHorizontal: 12,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  walletRowPressed: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderColor: 'rgba(99,102,241,0.4)',
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
    gap: 3,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  walletDetected: {
    fontSize: 12,
    color: Colors.neonGreen,
    fontWeight: '500',
  },
  walletNotInstalled: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  walletArrow: {
    fontSize: 22,
    color: '#374151',
    fontWeight: '300',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dividerText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 260,
  },
  footer: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
});
