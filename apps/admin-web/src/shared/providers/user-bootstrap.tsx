import { useEffect, type ReactNode } from 'react';

import { useAdminMe } from '@features/auth/api/use-admin-auth.ts';
import { useAdminAuth } from '@shared/hooks/use-auth.ts';
import { tokenStorage } from '@shared/helpers/token-storage.ts';
import { ADMIN_ROUTES } from '@shared/constants/routes.ts';

interface UserBootstrapProps {
  readonly children: ReactNode;
}

export function UserBootstrap({ children }: UserBootstrapProps) {
  const { user, setUser } = useAdminAuth();
  const { data } = useAdminMe();

  useEffect(() => {
    if (data === undefined) return;
    if (!data.isAdmin) {
      tokenStorage.clearTokens();
      window.location.href = ADMIN_ROUTES.LOGIN;
      return;
    }
    if (user === null) {
      setUser(data);
    }
  }, [data, user, setUser]);

  return <>{children}</>;
}
