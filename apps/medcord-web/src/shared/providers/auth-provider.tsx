import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { AuthTokens, User } from '@shared/types';
import { tokenStorage } from '@shared/helpers/token-storage.ts';

export interface AuthContextValue {
  readonly user: User | null;
  readonly activeHospitalId: string | null;
  readonly isAuthenticated: boolean;
  readonly setUser: (user: User) => void;
  readonly setTokens: (tokens: AuthTokens) => void;
  readonly setActiveHospitalId: (id: string) => void;
  readonly logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUserState] = useState<User | null>(null);
  const [activeHospitalId, setActiveHospitalIdState] = useState<string | null>(
    () => sessionStorage.getItem('medcord.active_hospital'),
  );

  const setUser = useCallback((incoming: User) => {
    setUserState(incoming);
  }, []);

  const setTokens = useCallback((tokens: AuthTokens) => {
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
  }, []);

  const setActiveHospitalId = useCallback((id: string) => {
    sessionStorage.setItem('medcord.active_hospital', id);
    setActiveHospitalIdState(id);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearTokens();
    sessionStorage.removeItem('medcord.active_hospital');
    setUserState(null);
    setActiveHospitalIdState(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      activeHospitalId,
      isAuthenticated: tokenStorage.getAccess() !== null,
      setUser,
      setTokens,
      setActiveHospitalId,
      logout,
    }),
    [user, activeHospitalId, setUser, setTokens, setActiveHospitalId, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuthContext must be used inside <AuthProvider>');
  }
  return ctx;
}
