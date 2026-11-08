import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Role, VerificationStatus } from '@/types/domain';

/**
 * Session state. For now an in-memory preview session so the whole flow can
 * be clicked through; real sign-up and verification replace the internals
 * later without changing this interface.
 */
type Session = { userId: string; role: Role; displayName: string; verification: VerificationStatus };

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
      signInAs: (role) =>
        setSession(
          role === 'receiver'
            ? { userId: 'p1', role, displayName: 'Amelia', verification: 'verified' }
            : { userId: 'm1', role, displayName: 'James', verification: 'verified' },
        ),
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
