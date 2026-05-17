import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SolanaWalletProvider } from '@/src/components/wallet/SolanaWalletProvider';

import DashboardScreen from '../app/(tabs)/index';
import PortfolioScreen from '../app/(tabs)/portfolio';
import AutomationsScreen from '../app/(tabs)/automations';
import PricingScreen from '../app/(tabs)/pricing';
import SettingsScreen from '../app/(tabs)/settings';

import { useAutomationStore } from '@/src/store/useAutomationStore';
import { useWalletStore } from '@/src/store/useWalletStore';
import { useOpenWalletModal } from '@/src/components/wallet/useOpenWalletModal';
import { truncateAddress } from '@/src/lib/formatters';
import { Colors } from '@/src/lib/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

const TAB_DEFS = [
  { name: 'index', title: 'Dashboard', icon: 'dashboard', href: '/' },
  { name: 'portfolio', title: 'Portfolio', icon: 'account_balance_wallet', href: '/portfolio' },
  { name: 'automations', title: 'Automations', icon: 'bolt', href: '/automations' },
  { name: 'pricing', title: 'Pricing', icon: 'payments', href: '/pricing' },
  { name: 'settings', title: 'Settings', icon: 'settings', href: '/settings' },
];

function MaterialIcon({ name, size = 20, color = Colors.textMuted }: { name: string; size?: number; color?: string; }) {
  const style = { fontSize: size, color, lineHeight: `${size}px`, verticalAlign: 'middle', display: 'inline-block', userSelect: 'none' as any };
  return <span className="material-symbols-outlined" style={style}>{name}</span>;
}

function WebNavBar() {
  const location = useLocation();
  const pathname = location.pathname;
  const automations = useAutomationStore((s) => s.automations);
  const triggeredCount = automations.filter((a) => a.status === 'triggered').length;
  const { connected, publicKey } = useWalletStore();
  const openWalletModal = useOpenWalletModal();

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0E17]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between mx-auto max-w-7xl px-6 h-16">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <span className="text-2xl text-[#00FF88] transition-transform group-hover:scale-110">◈</span>
          <span className="text-xl font-extrabold text-white tracking-tight">Colisto</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1.5">
          {TAB_DEFS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link 
                key={tab.name} 
                to={tab.href} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 no-underline ${
                  active 
                    ? 'bg-indigo-500/15 text-[#818CF8]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <MaterialIcon name={tab.icon} size={18} color={active ? '#818CF8' : 'currentColor'} />
                <span className="text-sm font-medium">{tab.title}</span>
                {tab.name === 'automations' && triggeredCount > 0 && (
                  <div className="bg-red-500 rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 ml-1">
                    <span className="text-[10px] font-bold text-white">{triggeredCount}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Connect Wallet */}
        <button 
          onClick={openWalletModal} 
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
            connected 
              ? 'bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] hover:bg-[#00FF88]/20' 
              : 'bg-indigo-600 border border-transparent text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25'
          }`}
        >
          <MaterialIcon name={connected ? 'check_circle' : 'account_balance_wallet'} size={16} color={connected ? '#00FF88' : '#FFF'} />
          <span className="text-sm font-semibold">
            {connected && publicKey ? truncateAddress(publicKey, 4) : 'Connect Wallet'}
          </span>
        </button>

      </div>
    </div>
  );
}

function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <WebNavBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
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
              <Route path="portfolio" element={<PortfolioScreen />} />
              <Route path="automations" element={<AutomationsScreen />} />
              <Route path="pricing" element={<PricingScreen />} />
              <Route path="settings" element={<SettingsScreen />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
}
