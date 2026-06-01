import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, login as apiLogin, register as apiRegister, getMe, logout as apiLogout, linkWallet } from '../api/auth';
import { getToken } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  /** Register a new account */
  register: (email: string, password: string) => Promise<void>;

  /** Log in with email + password */
  login: (email: string, password: string) => Promise<void>;

  /** Restore session from stored token (call on app boot) */
  restoreSession: () => Promise<void>;

  /** Link a Solana wallet address to the user */
  linkWallet: (address: string) => Promise<void>;

  /** Log out and clear all auth state */
  logout: () => void;

  /** Clear any error message */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiRegister(email, password);
          set({ user, token, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Registration failed', isLoading: false });
          throw err;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiLogin(email, password);
          set({ user, token, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Login failed', isLoading: false });
          throw err;
        }
      },

      restoreSession: async () => {
        const token = getToken();
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
          const { user } = await getMe();
          set({ user, token, isLoading: false });
        } catch {
          // Token expired or invalid — clear everything
          apiLogout();
          set({ user: null, token: null, isLoading: false });
        }
      },

      linkWallet: async (address: string) => {
        try {
          await linkWallet(address);
          set((state) => ({
            user: state.user ? { ...state.user, wallet_address: address } : null,
          }));
        } catch (err: any) {
          set({ error: err.message || 'Failed to link wallet' });
        }
      },

      logout: () => {
        apiLogout();
        set({ user: null, token: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'colisto-auth',
      // Only persist the token — user data is refreshed from the server
      partialize: (state) => ({ token: state.token }),
    }
  )
);
