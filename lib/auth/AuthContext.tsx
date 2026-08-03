'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '@/types/user';
import { apiPost } from '@/lib/api/client';
import { clearSession, readSession, writeSession } from '@/lib/auth/session';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // localStorage isn't available during SSR, so the session can only be read
  // after mount; this one-time sync on mount is intentional, not a loop.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(readSession());
    setReady(true);
  }, []);

  async function login(email: string, password: string) {
    const { user } = await apiPost<{ user: AuthUser }>('/api/auth/login', { email, password });
    writeSession(user);
    setUser(user);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
