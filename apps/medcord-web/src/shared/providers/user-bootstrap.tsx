import { useEffect, type ReactNode } from 'react';

import { useMe } from '@features/auth/api/use-me.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';

interface UserBootstrapProps {
  readonly children: ReactNode;
}

export function UserBootstrap({ children }: UserBootstrapProps) {
  const { user, setUser } = useAuth();
  const { data } = useMe();

  useEffect(() => {
    if (data !== undefined && user === null) {
      setUser(data);
    }
  }, [data, user, setUser]);

  return <>{children}</>;
}
