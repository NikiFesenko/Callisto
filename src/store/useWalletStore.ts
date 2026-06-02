// @ts-nocheck
import { create } from 'zustand';
import { getProfile } from '../api/walletProfile';
import { useWatchlistStore } from './useWatchlistStore';
import { useThemeStore } from './useThemeStore';
import { useAutomationStore } from './useAutomationStore';

/**
 * Wallet store that bridges the @solana/wallet-adapter-react hooks
 * with a global zustand store so non-hook contexts (navbar etc.) can read wallet state.
 *
 * On web, the actual connection is handled by the wallet adapter providers.
 * This store provides:
 *  - Synced state (publicKey, connected, wallet name)
 *  - openWalletModal() to trigger the custom WalletSelectModal
 *  - disconnect() to disconnect the current wallet
 *
 * On connect → fetches the wallet profile from MySQL and hydrates all stores.
 * On disconnect → clears all wallet-linked store state.
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
let _modalOpener: (() => void) | null = null;
let _disconnecter: (() => void) | null = null;

// Track the last publicKey we hydrated so we don't re-fetch on every adapter sync
let _lastHydratedKey: string | null = null;

/**
 * Fetch the wallet profile and hydrate all stores.
 * Called once per unique wallet connection.
 */
async function hydrateProfileStores(address: string) {
  try {
    console.log(`[WalletStore] Hydrating profile for ${address.slice(0, 8)}...`);
    const profile = await getProfile(address);

    useWatchlistStore.getState().hydrateFromWallet(address, profile.watchlist);
    useThemeStore.getState().hydrateFromWallet(address, profile.preferences);
    useAutomationStore.getState().hydrateFromWallet(
      address,
      (profile.preferences.automations as any[]) ?? []
    );

    console.log(`[WalletStore] ✅ Profile loaded — ${profile.watchlist.length} watchlist items`);
  } catch (err) {
    console.warn('[WalletStore] Profile hydration failed:', err);
  }
}

/**
 * Clear all wallet-linked store state on disconnect.
 */
function clearProfileStores() {
  useWatchlistStore.getState().clearForWallet();
  useThemeStore.getState().clearForWallet();
  useAutomationStore.getState().clearForWallet();
  _lastHydratedKey = null;
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
    clearProfileStores();
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
    const prev = get();

    set({
      publicKey: state.publicKey,
      connected: state.connected,
      connecting: state.connecting,
      walletName: state.walletName,
      walletIcon: state.walletIcon,
      provider: state.walletName?.toLowerCase() || null,
    });

    // Wallet just connected (or switched) — hydrate stores from DB
    if (state.connected && state.publicKey && state.publicKey !== _lastHydratedKey) {
      _lastHydratedKey = state.publicKey;
      hydrateProfileStores(state.publicKey);
    }

    // Wallet just disconnected — clear stores
    if (!state.connected && prev.connected) {
      clearProfileStores();
    }
  },

  _setModalOpener: (opener) => {
    _modalOpener = opener;
  },

  _setDisconnect: (disconnecter) => {
    _disconnecter = disconnecter;
  },
}));
