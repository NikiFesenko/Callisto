import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
  theme: 'dark' | 'light';
  rpcEndpoint: string;
  notificationsEnabled: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setRpcEndpoint: (endpoint: string) => void;
  toggleNotifications: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      notificationsEnabled: true,

      setTheme: (theme) => set({ theme }),
      setRpcEndpoint: (rpcEndpoint) => set({ rpcEndpoint }),
      toggleNotifications: () =>
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
    }),
    {
      name: 'colisto-settings',
    }
  )
);
