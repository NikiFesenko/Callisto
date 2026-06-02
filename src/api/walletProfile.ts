import { apiRequest } from './client';

export interface WalletPreferences {
  theme: 'dark' | 'light';
  rpcEndpoint: string;
  notificationsEnabled: boolean;
  automations: unknown[];
}

export interface WalletProfile {
  wallet_address: string;
  watchlist: string[];
  preferences: WalletPreferences;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch profile for a wallet address.
 * Auto-creates a default profile on the server if this is a first-time connect.
 */
export async function getProfile(address: string): Promise<WalletProfile> {
  const data = await apiRequest<{ profile: WalletProfile }>(
    `/wallet/${address}/profile`,
    { skipAuth: true }
  );
  return data.profile;
}

/**
 * Replace the full watchlist for a wallet.
 * Called whenever the watchlist changes (debounced in the store).
 */
export async function saveWatchlist(address: string, symbols: string[]): Promise<void> {
  await apiRequest(`/wallet/${address}/watchlist`, {
    method: 'PUT',
    body: JSON.stringify({ symbols }),
    skipAuth: true,
  });
}

/**
 * Merge-update preferences for a wallet.
 * Only the keys you pass are overwritten — others are preserved server-side.
 */
export async function savePreferences(
  address: string,
  preferences: Partial<WalletPreferences>
): Promise<void> {
  await apiRequest(`/wallet/${address}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
    skipAuth: true,
  });
}
