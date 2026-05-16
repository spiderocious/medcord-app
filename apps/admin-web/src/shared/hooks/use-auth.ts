import { useAdminAuthContext } from '@shared/providers/auth-provider.tsx';

export function useAdminAuth() {
  return useAdminAuthContext();
}
