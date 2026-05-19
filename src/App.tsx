import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SolanaWalletProvider } from '@/src/components/wallet/SolanaWalletProvider';

import DashboardScreen from '../app/(tabs)/index';
import PortfolioScreen from '../app/(tabs)/portfolio';
import AutomationsScreen from '../app/(tabs)/automations';
import CreateAutomationScreen from '../app/create-automation';
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
  { name: 'index', title: 'Dashboard', icon: 'grid_view', href: '/' },
  { name: 'portfolio', title: 'Portfolio', icon: 'account_balance_wallet', href: '/portfolio' },
  { name: 'automations', title: 'Automations', icon: 'auto_graph', href: '/automations' },
  { name: 'pricing', title: 'Pricing', icon: 'storefront', href: '/pricing' },
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
  const { connected, publicKey, disconnect } = useWalletStore();
  const openWalletModal = useOpenWalletModal();

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="flex items-center justify-between w-full border-b border-[#1E293B] bg-[#0A0E17] px-6 h-[72px]">
      
      {/* Logo Area */}
      <Link to="/" className="flex items-center gap-2 no-underline group flex-shrink-0 w-40">
        <span className="text-[#00FF88] text-xl transition-transform group-hover:scale-110">◈</span>
        <span className="text-white text-[11px] font-bold tracking-[0.3em] uppercase">Colisto</span>
      </Link>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-12 md:gap-16 mx-auto h-full">
        {TAB_DEFS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link 
              key={tab.name} 
              to={tab.href} 
              className={`relative flex items-center gap-2.5 h-full transition-all duration-300 no-underline ${
                active ? 'text-white' : 'text-[#94A3B8] hover:text-slate-200'
              }`}
            >
              <MaterialIcon name={tab.icon} size={18} color={active ? '#00FF88' : 'currentColor'} />
              <span className={`text-[13px] tracking-wide ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.title === 'Dashboard' ? 'Overview' : tab.title}
              </span>
              
              {/* Active Underline */}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#00FF88] rounded-t-full shadow-[0_-2px_10px_rgba(0,255,136,0.3)]" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center justify-end gap-6 flex-shrink-0 w-40">
        <button className="text-[#94A3B8] hover:text-white transition-colors cursor-pointer bg-transparent border-none flex items-center">
          <MaterialIcon name="light_mode" size={20} />
        </button>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={openWalletModal} 
            className="px-4 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] text-[#E2E8F0] hover:bg-[#334155] transition-colors cursor-pointer text-[13px] font-medium tracking-wide"
          >
            {connected && publicKey ? truncateAddress(publicKey, 4) : 'Connect'}
          </button>
          
          {connected && (
            <button 
              onClick={disconnect}
              className="text-[#94A3B8] hover:text-white text-[13px] font-medium transition-colors cursor-pointer bg-transparent border-none"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
}

function Layout() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#05070B] p-2 sm:p-4 md:p-6">
      <div className="flex-1 flex flex-col w-full bg-[#0A0E17] border border-[#1E293B] rounded-[24px] overflow-hidden shadow-2xl">
        <WebNavBar />
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
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
