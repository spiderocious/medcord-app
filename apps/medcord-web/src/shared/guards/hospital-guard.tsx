import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { ROUTES } from '@shared/constants/routes.ts';
import { useAuthContext } from '@shared/providers/auth-provider.tsx';

interface HospitalGuardProps {
  readonly children: ReactNode;
}

export function HospitalGuard({ children }: HospitalGuardProps) {
  const { activeHospitalId } = useAuthContext();

  if (activeHospitalId === null) {
    return <Navigate to={ROUTES.HOSPITALS} replace />;
  }

  return <>{children}</>;
}
