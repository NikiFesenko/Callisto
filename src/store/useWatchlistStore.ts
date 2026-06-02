import { create } from 'zustand';
import { saveWatchlist } from '../api/walletProfile';

// Debounce helper — delays DB writes until user stops changing things
let _watchlistSyncTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSyncWatchlist(address: string, symbols: string[], delay = 600) {
  if (_watchlistSyncTimer) clearTimeout(_watchlistSyncTimer);
  _watchlistSyncTimer = setTimeout(() => {
    saveWatchlist(address, symbols).catch((err) =>
      console.warn('[WatchlistStore] sync failed:', err)
    );
  }, delay);
}

interface WatchlistState {
  symbols: string[];
  _walletAddress: string | null;

  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  toggleSymbol: (symbol: string) => void;
  hasSymbol: (symbol: string) => boolean;

  /** Called by useWalletStore when a wallet connects — hydrates from DB */
  hydrateFromWallet: (address: string, symbols: string[]) => void;
  /** Called on wallet disconnect — clears to empty */
  clearForWallet: () => void;
}

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  symbols: [],
  _walletAddress: null,

  addSymbol: (symbol) => {
    set((state) => {
      if (state.symbols.includes(symbol)) return state;
      const next = [...state.symbols, symbol];
      if (state._walletAddress) debouncedSyncWatchlist(state._walletAddress, next);
      return { symbols: next };
    });
  },

  removeSymbol: (symbol) => {
    set((state) => {
      const next = state.symbols.filter((s) => s !== symbol);
      if (state._walletAddress) debouncedSyncWatchlist(state._walletAddress, next);
      return { symbols: next };
    });
  },

  toggleSymbol: (symbol) => {
    set((state) => {
      const next = state.symbols.includes(symbol)
        ? state.symbols.filter((s) => s !== symbol)
        : [...state.symbols, symbol];
      if (state._walletAddress) debouncedSyncWatchlist(state._walletAddress, next);
      return { symbols: next };
    });
  },

  hasSymbol: (symbol) => get().symbols.includes(symbol),

  hydrateFromWallet: (address, symbols) => {
    set({ symbols, _walletAddress: address });
  },

  clearForWallet: () => {
    if (_watchlistSyncTimer) clearTimeout(_watchlistSyncTimer);
    set({ symbols: [], _walletAddress: null });
  },
}));
