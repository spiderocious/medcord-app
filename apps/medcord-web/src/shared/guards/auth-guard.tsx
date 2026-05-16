import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { ROUTES } from '@shared/constants/routes.ts';
import { tokenStorage } from '@shared/helpers/token-storage.ts';

interface AuthGuardProps {
  readonly children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const hasToken = tokenStorage.getAccess() !== null;

  if (!hasToken) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?next=${next}`} replace />;
  }

  return <>{children}</>;
}
