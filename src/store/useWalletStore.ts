// @ts-nocheck
import { create } from 'zustand';


/**
 * Wallet store that bridges the @solana/wallet-adapter-react hooks
 * with a global zustand store so non-hook contexts (navbar etc.) can read wallet state.
 *
 * On web, the actual connection is handled by the wallet adapter providers.
 * This store provides:
 *  - Synced state (publicKey, connected, wallet name)
 *  - openWalletModal() to trigger the custom WalletSelectModal
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

  // Internal — called by WalletSelectModal and WalletSyncProvider
  _syncFromAdapter: (state: {
    publicKey: string | null;
    connected: boolean;
    connecting: boolean;
    walletName: string | null;
    walletIcon: string | null;
  }) => void;
  _setModalOpener: (opener: (() => void) | null) => void;
  _setDisconnect: (disconnecter: () => void) => void;
}

// Module-level refs for callbacks — stored OUTSIDE Zustand to survive state updates
// (Zustand recreates the state object on every update, which would lose non-state properties)
let _modalOpener: (() => void) | null = null;
let _disconnecter: (() => void) | null = null;

export const useWalletStore = create<WalletState>((set, get) => ({
  publicKey: null,
  connected: false,
  connecting: false,
  walletName: null,
  walletIcon: null,
  provider: null,
  error: null,

  openWalletModal: () => {
    if (typeof _modalOpener === 'function') {
      _modalOpener();
    } else if (typeof window !== 'undefined') {
      console.warn('[WalletStore] openWalletModal called but no modal opener registered yet');
    }
  },

  disconnect: () => {
    if (typeof _disconnecter === 'function') {
      _disconnecter();
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
    _modalOpener = opener;
  },

  _setDisconnect: (disconnecter) => {
    _disconnecter = disconnecter;
  },
}));
