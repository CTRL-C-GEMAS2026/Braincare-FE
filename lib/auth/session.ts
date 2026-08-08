import type { AuthUser } from '@/types/user';

const KEY = 'braincare_session';

export interface Session {
  user: AuthUser;
  token: string;
}

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}

export function getToken(): string | null {
  return readSession()?.token ?? null;
}
