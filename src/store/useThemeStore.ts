import { create } from 'zustand';
import { savePreferences } from '../api/walletProfile';

let _themeSyncTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSyncPreferences(
  address: string,
  patch: Record<string, unknown>,
  delay = 600
) {
  if (_themeSyncTimer) clearTimeout(_themeSyncTimer);
  _themeSyncTimer = setTimeout(() => {
    savePreferences(address, patch as any).catch((err) =>
      console.warn('[ThemeStore] sync failed:', err)
    );
  }, delay);
}

const DEFAULTS = {
  theme: 'dark' as 'dark' | 'light',
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  notificationsEnabled: true,
};

interface ThemeState {
  theme: 'dark' | 'light';
  rpcEndpoint: string;
  notificationsEnabled: boolean;
  _walletAddress: string | null;

  setTheme: (theme: 'dark' | 'light') => void;
  setRpcEndpoint: (endpoint: string) => void;
  toggleNotifications: () => void;

  /** Called by useWalletStore when a wallet connects — hydrates from DB */
  hydrateFromWallet: (address: string, prefs: Partial<typeof DEFAULTS>) => void;
  /** Called on wallet disconnect — revert to defaults */
  clearForWallet: () => void;
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  ...DEFAULTS,
  _walletAddress: null,

  setTheme: (theme) => {
    set({ theme });
    const addr = get()._walletAddress;
    if (addr) debouncedSyncPreferences(addr, { theme });
    // Always apply to <html> immediately
    document.documentElement.setAttribute('data-theme', theme);
  },

  setRpcEndpoint: (rpcEndpoint) => {
    set({ rpcEndpoint });
    const addr = get()._walletAddress;
    if (addr) debouncedSyncPreferences(addr, { rpcEndpoint });
  },

  toggleNotifications: () => {
    set((state) => {
      const notificationsEnabled = !state.notificationsEnabled;
      if (state._walletAddress) {
        debouncedSyncPreferences(state._walletAddress, { notificationsEnabled });
      }
      return { notificationsEnabled };
    });
  },

  hydrateFromWallet: (address, prefs) => {
    set({
      _walletAddress: address,
      theme: prefs.theme ?? DEFAULTS.theme,
      rpcEndpoint: prefs.rpcEndpoint ?? DEFAULTS.rpcEndpoint,
      notificationsEnabled: prefs.notificationsEnabled ?? DEFAULTS.notificationsEnabled,
    });
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', prefs.theme ?? DEFAULTS.theme);
  },

  clearForWallet: () => {
    if (_themeSyncTimer) clearTimeout(_themeSyncTimer);
    set({ ...DEFAULTS, _walletAddress: null });
    document.documentElement.setAttribute('data-theme', DEFAULTS.theme);
  },
}));
