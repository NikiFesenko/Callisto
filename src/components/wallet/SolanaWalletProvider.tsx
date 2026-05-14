// @ts-nocheck
/**
 * SolanaWalletProvider — sets up the @solana/wallet-adapter providers for web.
 * 
 * The wallet adapter modules are imported unconditionally at the top of the file
 * so Metro bundles them properly. The providers are only MOUNTED on the web client
 * (guarded by useState/useEffect) to avoid SSR context crashes.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletSyncProvider } from '@/src/components/wallet/WalletSyncProvider';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

function WalletProvidersInner({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletSyncProvider>
            {children}
          </WalletSyncProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  // Defer provider mounting to client-side only
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsMounted(true);
      
      // Foolproof CSS injection for the wallet modal to ensure it works in Expo dev mode
      if (typeof document !== 'undefined' && !document.getElementById('wallet-adapter-css')) {
        const link = document.createElement('link');
        link.id = 'wallet-adapter-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/@solana/wallet-adapter-react-ui@latest/styles.css';
        document.head.appendChild(link);
      }
    }
  }, []);

  if (isMounted) {
    return <WalletProvidersInner>{children}</WalletProvidersInner>;
  }

  // SSR, native, or pre-mount — passthrough
  return <>{children}</>;
}
