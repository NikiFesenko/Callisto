import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  symbols: string[];
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  toggleSymbol: (symbol: string) => void;
  hasSymbol: (symbol: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: [], // Defaults to empty, user can add
      addSymbol: (symbol) => set((state) => ({
        symbols: state.symbols.includes(symbol) ? state.symbols : [...state.symbols, symbol]
      })),
      removeSymbol: (symbol) => set((state) => ({
        symbols: state.symbols.filter((s) => s !== symbol)
      })),
      toggleSymbol: (symbol) => set((state) => {
        if (state.symbols.includes(symbol)) {
          return { symbols: state.symbols.filter((s) => s !== symbol) };
        } else {
          return { symbols: [...state.symbols, symbol] };
        }
      }),
      hasSymbol: (symbol) => get().symbols.includes(symbol)
    }),
    {
      name: 'colisto-watchlist-storage', // unique name for localStorage
    }
  )
);
