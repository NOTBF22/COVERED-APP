import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Role } from '@/types/domain';

/**
 * Session state. For step 1 this is an in-memory mock so the whole flow can be
 * clicked through; step 2 swaps the internals for Supabase Auth without
 * changing this interface.
 */
type Session = { userId: string; role: Role };

type AuthContextValue = {
  session: Session | null;
  signInAs: (role: Role) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signInAs: (role) => setSession({ userId: role === 'recipient' ? 'p1' : 'me', role }),
      signOut: () => setSession(null),
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
