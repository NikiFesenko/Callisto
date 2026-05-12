// @ts-nocheck
import React from 'react';
import { Tabs, Link, usePathname } from 'expo-router';
import { Platform, View, Text as RNText, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/src/lib/constants';
import { useAutomationStore } from '@/src/store/useAutomationStore';
import { useWalletStore } from '@/src/store/useWalletStore';
import { useOpenWalletModal } from '@/src/components/wallet/useOpenWalletModal';
import { truncateAddress } from '@/src/lib/formatters';

/**
 * Material Icon component for web.
 * Uses Google Material Symbols Outlined via className on a raw <span>.
 * Falls back to a text label on native.
 */
function MaterialIcon({ name, size = 20, color = Colors.textMuted }: {
  name: string; size?: number; color?: string;
}) {
  if (Platform.OS === 'web') {
    // Use raw <span> with className for Material Symbols
    const style = {
      fontSize: size,
      color,
      lineHeight: `${size}px`,
      verticalAlign: 'middle',
      display: 'inline-block',
      userSelect: 'none' as any,
    };
    return React.createElement('span', {
      className: 'material-symbols-outlined',
      style,
    }, name);
  }
  // Native fallback
  return <RNText style={{ fontSize: size - 2, color }}>{name}</RNText>;
}

const TAB_DEFS = [
  { name: 'index', title: 'Dashboard', icon: 'dashboard', href: '/' },
  { name: 'portfolio', title: 'Portfolio', icon: 'account_balance_wallet', href: '/portfolio' },
  { name: 'automations', title: 'Automations', icon: 'bolt', href: '/automations' },
  { name: 'settings', title: 'Settings', icon: 'settings', href: '/settings' },
] as const;

/**
 * Injects the Material Symbols font into the web document <head>.
 * Called once on mount for web only.
 */
function useInjectMaterialIcons() {
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const LINK_ID = 'material-symbols-link';
    if (document.getElementById(LINK_ID)) return; // already injected

    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    document.head.appendChild(link);
  }, []);
}

/**
 * Web top navbar using expo-router <Link> for proper static-mode navigation.
 * Each tab is a <Link href="..."> which expo-router handles with client-side
 * transitions even in static output mode.
 */
function WebNavBar() {
  useInjectMaterialIcons();

  const pathname = usePathname();
  const automations = useAutomationStore((s) => s.automations);
  const triggeredCount = automations.filter((a) => a.status === 'triggered').length;
  const { connected, publicKey } = useWalletStore();
  const openWalletModal = useOpenWalletModal();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '' : pathname.startsWith(href);

  return (
    <View style={styles.navOuter}>
      <View style={styles.navBar}>
        {/* Brand */}
        <Link href="/" style={styles.brand}>
          <RNText style={styles.brandIcon}>◈</RNText>
          <RNText style={styles.brandText}>Colisto</RNText>
        </Link>

        {/* Tab links */}
        <View style={styles.navLinks}>
          {TAB_DEFS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.name}
                href={tab.href as any}
                style={[styles.navLink, active && styles.navLinkActive]}
                accessibilityLabel={`${tab.title} tab`}
              >
                <MaterialIcon
                  name={tab.icon}
                  size={20}
                  color={active ? Colors.textPrimary : Colors.textMuted}
                />
                <RNText style={[styles.navLabel, active && styles.navLabelActive]}>
                  {tab.title}
                </RNText>
                {tab.name === 'automations' && triggeredCount > 0 && (
                  <View style={styles.badge}>
                    <RNText style={styles.badgeText}>{triggeredCount}</RNText>
                  </View>
                )}
                {active && <View style={styles.activeIndicator} />}
              </Link>
            );
          })}
        </View>

        {/* Wallet Button */}
        <Pressable
          onPress={openWalletModal}
          style={({ pressed }) => [
            styles.walletButton,
            connected && styles.walletButtonConnected,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityLabel={connected ? 'Wallet connected' : 'Connect wallet'}
        >
          <MaterialIcon
            name={connected ? 'check_circle' : 'account_balance_wallet'}
            size={16}
            color={connected ? Colors.neonGreen : '#FFF'}
          />
          <RNText style={[
            styles.walletButtonText,
            connected && styles.walletButtonTextConnected,
          ]}>
            {connected && publicKey
              ? truncateAddress(publicKey, 4)
              : 'Connect Wallet'}
          </RNText>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  navOuter: {
    position: 'sticky' as any,
    top: 0,
    zIndex: 100,
    width: '100%',
    backgroundColor: 'rgba(10, 14, 23, 0.88)',
    backdropFilter: 'blur(20px)' as any,
    WebkitBackdropFilter: 'blur(20px)' as any,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    boxShadow: '0 2px 20px rgba(0,0,0,0.3)' as any,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    height: 64,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 130,
    textDecorationLine: 'none' as any,
  },
  brandIcon: {
    fontSize: 24,
    color: Colors.neonGreen,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    position: 'relative',
    cursor: 'pointer' as any,
    textDecorationLine: 'none' as any,
    transition: 'background-color 0.15s ease' as any,
  },
  navLinkActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  navLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 22,
    right: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.neonGreen,
  },
  badge: {
    backgroundColor: Colors.coralRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.indigo,
    cursor: 'pointer' as any,
    transition: 'all 0.15s ease' as any,
  },
  walletButtonConnected: {
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.25)',
  },
  walletButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  walletButtonTextConnected: {
    color: Colors.neonGreen,
  },
});

/* ─── Layout Export ─── */
export default function TabLayout() {
  const automations = useAutomationStore((s) => s.automations);
  const triggeredCount = automations.filter((a) => a.status === 'triggered').length;

  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarPosition: 'top',
        }}
        tabBar={() => <WebNavBar />}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
        <Tabs.Screen name="automations" options={{ title: 'Automations' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    );
  }

  // Mobile: bottom tab bar
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 14, 23, 0.95)',
          borderTopColor: Colors.borderSubtle,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.neonGreen,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: () => <RNText style={{ fontSize: 20 }}>📊</RNText> }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{ title: 'Portfolio', tabBarIcon: () => <RNText style={{ fontSize: 20 }}>💰</RNText> }}
      />
      <Tabs.Screen
        name="automations"
        options={{
          title: 'Automations',
          tabBarIcon: () => <RNText style={{ fontSize: 20 }}>⚡</RNText>,
          tabBarBadge: triggeredCount > 0 ? triggeredCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.coralRed, fontSize: 10, minWidth: 18, height: 18 },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: () => <RNText style={{ fontSize: 20 }}>⚙️</RNText> }}
      />
    </Tabs>
  );
}
