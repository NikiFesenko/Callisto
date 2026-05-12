// @ts-nocheck
import { create } from 'zustand';
import { Platform } from 'react-native';

/**
 * Wallet store that bridges the @solana/wallet-adapter-react hooks
 * with a global zustand store so non-hook contexts (navbar etc.) can read wallet state.
 *
 * On web, the actual connection is handled by the wallet adapter providers.
 * This store provides:
 *  - Synced state (publicKey, connected, wallet name)
 *  - openWalletModal() to trigger the adapter's wallet selection modal
 *  - disconnect() to disconnect the current wallet
 */

export type WalletProvider = 'phantom' | 'solflare' | 'backpack' | 'walletconnect' | string;

interface WalletState {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  walletName: string | null;
  walletIcon: string | null;
  provider: WalletProvider | null;
  error: string | null;

  // Actions
  openWalletModal: () => void;
  disconnect: () => void;
  setError: (error: string | null) => void;

  // Internal — called by the WalletSyncProvider to keep zustand in sync
  _syncFromAdapter: (state: {
    publicKey: string | null;
    connected: boolean;
    connecting: boolean;
    walletName: string | null;
    walletIcon: string | null;
  }) => void;
  _setModalOpener: (opener: () => void) => void;
  _setDisconnect: (disconnecter: () => void) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  publicKey: null,
  connected: false,
  connecting: false,
  walletName: null,
  walletIcon: null,
  provider: null,
  error: null,

  openWalletModal: () => {
    const opener = (get() as any).__modalOpener;
    if (opener) {
      opener();
    } else if (Platform.OS === 'web') {
      console.warn('Wallet modal opener not ready yet');
    }
  },

  disconnect: () => {
    const disconnecter = (get() as any).__disconnecter;
    if (disconnecter) {
      disconnecter();
    }
    set({
      publicKey: null,
      connected: false,
      connecting: false,
      walletName: null,
      walletIcon: null,
      provider: null,
      error: null,
    });
  },

  setError: (error) => set({ error }),

  _syncFromAdapter: (state) => {
    set({
      publicKey: state.publicKey,
      connected: state.connected,
      connecting: state.connecting,
      walletName: state.walletName,
      walletIcon: state.walletIcon,
      provider: state.walletName?.toLowerCase() || null,
    });
  },

  _setModalOpener: (opener) => {
    // Store as a non-reactive internal ref
    (get() as any).__modalOpener = opener;
  },

  _setDisconnect: (disconnecter) => {
    (get() as any).__disconnecter = disconnecter;
  },
}));
