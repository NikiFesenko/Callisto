// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SolanaWalletProvider } from '@/src/components/wallet/SolanaWalletProvider';

import DashboardScreen from '../app/(tabs)/index';
import PortfolioScreen from '../app/(tabs)/portfolio';
import AutomationsScreen from '../app/(tabs)/automations';
import CreateAutomationScreen from '../app/create-automation';
import PricingScreen from '../app/(tabs)/pricing';
import SettingsScreen from '../app/(tabs)/settings';
import MarketsScreen from '../app/(tabs)/markets';

import { useAutomationStore } from '@/src/store/useAutomationStore';
import { useWalletStore } from '@/src/store/useWalletStore';
import { useOpenWalletModal } from '@/src/components/wallet/useOpenWalletModal';
import { truncateAddress } from '@/src/lib/formatters';
import { useThemeStore } from '@/src/store/useThemeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

const TAB_DEFS = [
  { name: 'index',       title: 'Overview',     icon: 'grid_view',              href: '/' },
  { name: 'markets',     title: 'Markets',       icon: 'public',                 href: '/markets' },
  { name: 'portfolio',   title: 'Portfolio',     icon: 'account_balance_wallet', href: '/portfolio' },
  { name: 'automations', title: 'Automations',   icon: 'auto_graph',             href: '/automations' },
  { name: 'pricing',     title: 'Pricing',       icon: 'storefront',             href: '/pricing' },
  { name: 'settings',    title: 'Settings',      icon: 'settings',               href: '/settings' },
];

function MaterialIcon({ name, size = 18, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, color, lineHeight: `${size}px`, verticalAlign: 'middle', display: 'inline-block', userSelect: 'none', flexShrink: 0 }}
    >
      {name}
    </span>
  );
}

function WebNavBar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { connected, publicKey, disconnect } = useWalletStore();
  const openWalletModal = useOpenWalletModal();
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <nav
      className="colisto-navbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, #7C3AED 0%, #00FFA3 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color: '#fff',
          boxShadow: '0 0 16px rgba(124,58,237,0.4)',
        }}>◈</div>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
          Colisto
        </span>
      </Link>

      {/* Nav links — desktop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%', flex: 1, justifyContent: 'center' }}>
        {TAB_DEFS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.name}
              to={tab.href}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: '100%',
                padding: '0 14px',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: active ? '2px solid var(--accent-green)' : '2px solid transparent',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              <MaterialIcon name={tab.icon} size={15} color={active ? 'var(--accent-green)' : 'currentColor'} />
              {tab.title}
            </Link>
          );
        })}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: 34, height: 34,
            borderRadius: 8,
            background: 'var(--bg-badge)',
            border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-badge)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }}
        >
          <MaterialIcon name={isDark ? 'light_mode' : 'dark_mode'} size={16} color="currentColor" />
        </button>

        {/* Wallet button */}
        <button
          onClick={openWalletModal}
          style={{
            height: 34,
            padding: '0 14px',
            borderRadius: 8,
            background: connected ? 'var(--bg-badge)' : 'var(--gradient-purple)',
            border: connected ? '1px solid var(--border-default)' : 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'opacity 0.15s ease',
            backgroundImage: connected ? undefined : 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
            boxShadow: connected ? undefined : '0 0 20px rgba(124,58,237,0.35)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {connected ? (
            <>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
              <span style={{ color: 'var(--text-primary)', fontFamily: 'Space Mono, monospace', fontSize: 12 }}>
                {truncateAddress(publicKey!, 4)}
              </span>
            </>
          ) : (
            <>
              <MaterialIcon name="account_balance_wallet" size={14} color="#fff" />
              Connect
            </>
          )}
        </button>

        {connected && (
          <button
            onClick={disconnect}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-red)';
              (e.currentTarget as HTMLElement).style.color = 'var(--accent-red)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}

function Layout() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="colisto-layout-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        className="colisto-layout-surface"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          margin: '8px',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <WebNavBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardScreen />} />
              <Route path="markets" element={<MarketsScreen />} />
              <Route path="portfolio" element={<PortfolioScreen />} />
              <Route path="automations" element={<AutomationsScreen />} />
              <Route path="create-automation" element={<CreateAutomationScreen />} />
              <Route path="pricing" element={<PricingScreen />} />
              <Route path="settings" element={<SettingsScreen />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
}
