import type { AuthUser } from '@/types/user';

const KEY = 'braincare_session';

export function readSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function writeSession(user: AuthUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}
