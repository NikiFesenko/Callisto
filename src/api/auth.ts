import { apiRequest, setToken, removeToken } from './client';

export interface User {
  id: number;
  email: string;
  wallet_address: string | null;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/** Register a new account */
export async function register(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setToken(data.token);
  return data;
}

/** Log in and receive a JWT */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setToken(data.token);
  return data;
}

/** Fetch the current authenticated user */
export async function getMe(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/me');
}

/** Link a Solana wallet address to the user account */
export async function linkWallet(wallet_address: string): Promise<{ success: boolean; wallet_address: string }> {
  return apiRequest('/auth/wallet', {
    method: 'PATCH',
    body: JSON.stringify({ wallet_address }),
  });
}

/** Log out — removes the stored token */
export function logout(): void {
  removeToken();
}
