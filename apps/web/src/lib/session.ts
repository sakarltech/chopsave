import type { AuthUser, VerifyOtpResponse } from './api';

const accessTokenKey = 'chopsave.access-token';
const refreshTokenKey = 'chopsave.refresh-token';
const userKey = 'chopsave.user';

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export function saveSession(response: VerifyOtpResponse): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(accessTokenKey, response.accessToken);
  window.localStorage.setItem(refreshTokenKey, response.refreshToken);
  window.localStorage.setItem(userKey, JSON.stringify(response.user));
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;

  const accessToken = window.localStorage.getItem(accessTokenKey);
  const refreshToken = window.localStorage.getItem(refreshTokenKey);
  const rawUser = window.localStorage.getItem(userKey);
  if (!accessToken || !refreshToken || !rawUser) return null;

  try {
    return { accessToken, refreshToken, user: JSON.parse(rawUser) as AuthUser };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(accessTokenKey);
  window.localStorage.removeItem(refreshTokenKey);
  window.localStorage.removeItem(userKey);
}
