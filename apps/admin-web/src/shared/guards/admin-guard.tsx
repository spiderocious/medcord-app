import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { ADMIN_ROUTES } from '@shared/constants/routes.ts';
import { tokenStorage } from '@shared/helpers/token-storage.ts';

interface AdminGuardProps {
  readonly children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const hasToken = tokenStorage.getAccess() !== null;

  if (!hasToken) return <Navigate to={ADMIN_ROUTES.LOGIN} replace />;

  return <>{children}</>;
}
