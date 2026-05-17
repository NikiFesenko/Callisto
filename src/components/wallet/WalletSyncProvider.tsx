// @ts-nocheck
/**
 * WalletSyncProvider — bridges @solana/wallet-adapter-react hooks
 * with the zustand useWalletStore so that non-hook consumers
 * (e.g. the navbar) can read wallet state.
 *
 * The modal opener is registered by WalletSelectModal directly.
 * This provider only syncs wallet connection state and the disconnect function.
 */
import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/src/store/useWalletStore';

export function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, connecting, wallet, disconnect } = useWallet();
  const store = useWalletStore;

  // Sync adapter state → zustand store
  useEffect(() => {
    store.getState()._syncFromAdapter({
      publicKey: publicKey?.toBase58() || null,
      connected,
      connecting,
      walletName: wallet?.adapter?.name || null,
      walletIcon: wallet?.adapter?.icon || null,
    });
  }, [publicKey, connected, connecting, wallet]);

  // Provide the disconnect function to the store
  useEffect(() => {
    store.getState()._setDisconnect(() => disconnect());
  }, [disconnect]);

  return <>{children}</>;
}
