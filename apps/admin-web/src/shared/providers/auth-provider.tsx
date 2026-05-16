import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { AdminUser } from '@shared/types/admin.ts';
import { tokenStorage } from '@shared/helpers/token-storage.ts';
import { ADMIN_ROUTES } from '@shared/constants/routes.ts';

export interface AdminAuthContextValue {
  readonly user: AdminUser | null;
  readonly isAuthenticated: boolean;
  readonly setUser: (user: AdminUser) => void;
  readonly setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  readonly logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

interface AdminAuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUserState] = useState<AdminUser | null>(null);

  const setUser = useCallback((incoming: AdminUser) => {
    setUserState(incoming);
  }, []);

  const setTokens = useCallback((tokens: { accessToken: string; refreshToken: string }) => {
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearTokens();
    setUserState(null);
    window.location.href = ADMIN_ROUTES.LOGIN;
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      isAuthenticated: tokenStorage.getAccess() !== null,
      setUser,
      setTokens,
      logout,
    }),
    [user, setUser, setTokens, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuthContext(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (ctx === null) {
    throw new Error('useAdminAuthContext must be used inside <AuthProvider>');
  }
  return ctx;
}
