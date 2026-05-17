// @ts-nocheck
/**
 * SolanaWalletProvider — sets up the @solana/wallet-adapter providers for web.
 *
 * Uses a custom WalletSelectModal that renders as a fixed-position overlay
 * on web and a native Modal on native, bypassing ReactDOM.createPortal issues.
 *
 * The WalletSelectModal is rendered as a SIBLING to children (not nested inside
 * them) to ensure it's outside any overflow:hidden containers.
 */
import React, { useMemo, useState, useEffect } from 'react';

import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletSyncProvider } from '@/src/components/wallet/WalletSyncProvider';
import { WalletSelectModal } from '@/src/components/wallet/WalletSelectModal';

const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

function WalletProvidersInner({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        {/* WalletSelectModal sits at root level — sibling to children, not nested inside them.
            This ensures position:fixed on web can escape any overflow:hidden containers. */}
        <WalletSelectModal />
        <WalletSyncProvider>
          {children}
        </WalletSyncProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isMounted) {
    return <WalletProvidersInner>{children}</WalletProvidersInner>;
  }

  // SSR, native, or pre-mount — passthrough
  return <>{children}</>;
}
