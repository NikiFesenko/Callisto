// @ts-nocheck
import { useOpenWalletModal } from '@/src/components/wallet/useOpenWalletModal';
import { Colors } from '@/src/lib/constants';
import { truncateAddress } from '@/src/lib/formatters';
import { useAutomationStore } from '@/src/store/useAutomationStore';
import { useWalletStore } from '@/src/store/useWalletStore';
import { Link, Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Platform, Pressable, Text as RNText, StyleSheet, View } from 'react-native';

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
  { name: 'pricing', title: 'Pricing', icon: 'payments', href: '/pricing' },
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
 * On mobile (< 768px) the nav links collapse into a hamburger drawer.
 */
function WebNavBar() {
  useInjectMaterialIcons();

  const pathname = usePathname();
  const automations = useAutomationStore((s) => s.automations);
  const triggeredCount = automations.filter((a) => a.status === 'triggered').length;
  const { connected, publicKey } = useWalletStore();
  const openWalletModal = useOpenWalletModal();

  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false); // auto-close when going to desktop
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when route changes
  React.useEffect(() => { setMenuOpen(false); }, [pathname]);

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

        {/* Desktop: Tab links */}
        {!isMobile && (
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
        )}

        {/* Right side: Wallet + Hamburger (mobile) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
            {!isMobile && (
              <RNText style={[
                styles.walletButtonText,
                connected && styles.walletButtonTextConnected,
              ]}>
                {connected && publicKey
                  ? truncateAddress(publicKey, 4)
                  : 'Connect Wallet'}
              </RNText>
            )}
          </Pressable>

          {/* Hamburger (mobile only) */}
          {isMobile && (
            <Pressable
              onPress={() => setMenuOpen((v) => !v)}
              accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
              style={{
                width: 40, height: 40,
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: menuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
              } as any}
            >
              {/* Animated hamburger → X */}
              <RNText style={{ fontSize: 20, color: Colors.textPrimary, lineHeight: 22 } as any}>
                {menuOpen ? '✕' : '☰'}
              </RNText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Mobile Drawer */}
      {isMobile && menuOpen && Platform.OS === 'web' && (
        <>
          {/* Backdrop */}
          {React.createElement('div', {
            onClick: () => setMenuOpen(false),
            style: {
              position: 'fixed',
              inset: 0,
              top: 64,
              zIndex: 98,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            },
          })}
          {/* Drawer panel */}
          {React.createElement('div', {
            className: 'mobile-nav-drawer',
            style: {
              position: 'fixed',
              top: 64,
              left: 0,
              right: 0,
              zIndex: 99,
              background: 'rgba(8,11,22,0.97)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              padding: '8px 16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            },
          },
            // Nav items
            ...TAB_DEFS.map((tab) => {
              const active = isActive(tab.href);
              return React.createElement(
                Link,
                {
                  key: tab.name,
                  href: tab.href as any,
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 12,
                    backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    textDecorationLine: 'none',
                    position: 'relative',
                  } as any,
                  accessibilityLabel: `${tab.title} tab`,
                },
                React.createElement(MaterialIcon, {
                  name: tab.icon,
                  size: 22,
                  color: active ? Colors.textPrimary : Colors.textMuted,
                }),
                React.createElement(
                  RNText,
                  {
                    style: {
                      fontSize: 16,
                      fontWeight: active ? '700' : '500',
                      color: active ? Colors.textPrimary : Colors.textMuted,
                      flex: 1,
                    } as any,
                  },
                  tab.title
                ),
                // Badge for automations
                tab.name === 'automations' && triggeredCount > 0
                  ? React.createElement(
                      View,
                      { style: styles.badge },
                      React.createElement(RNText, { style: styles.badgeText }, triggeredCount)
                    )
                  : null,
                // Active dot
                active
                  ? React.createElement('div', {
                      style: {
                        width: 6, height: 6,
                        borderRadius: '50%',
                        background: Colors.neonGreen,
                        boxShadow: `0 0 8px ${Colors.neonGreen}`,
                      },
                    })
                  : null
              );
            }),
            // Bottom wallet info row
            connected && publicKey
              ? React.createElement(
                  'div',
                  {
                    style: {
                      marginTop: 8,
                      padding: '10px 16px',
                      borderRadius: 10,
                      background: 'rgba(0,255,163,0.05)',
                      border: '1px solid rgba(0,255,163,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    },
                  },
                  React.createElement(MaterialIcon, { name: 'check_circle', size: 16, color: Colors.neonGreen }),
                  React.createElement(
                    RNText,
                    { style: { fontSize: 13, color: Colors.neonGreen, fontWeight: '600' } as any },
                    truncateAddress(publicKey, 6)
                  )
                )
              : null
          )}
        </>
      )}
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
    backgroundColor: 'rgba(5, 5, 5, 0.88)',
    backdropFilter: 'blur(20px)' as any,
    WebkitBackdropFilter: 'blur(20px)' as any,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    boxShadow: '0 2px 20px rgba(0,0,0,0.5)' as any,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: '#FAFAFA',
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
    borderRadius: 100,
    backgroundColor: Colors.border,
    cursor: 'pointer' as any,
    transition: 'all 0.15s ease' as any,
  },
  walletButtonConnected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
        <Tabs.Screen name="pricing" options={{ title: 'Pricing' }} />
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
          backgroundColor: 'rgba(9, 9, 11, 0.95)',
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
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
        name="pricing"
        options={{ title: 'Pricing', tabBarIcon: () => <RNText style={{ fontSize: 20 }}>💎</RNText> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: () => <RNText style={{ fontSize: 20 }}>⚙️</RNText> }}
      />
    </Tabs>
  );
}
