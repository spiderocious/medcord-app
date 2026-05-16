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
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
