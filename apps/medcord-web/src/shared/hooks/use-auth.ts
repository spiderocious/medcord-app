import { useAuthContext } from '@shared/providers/auth-provider.tsx';

export function useAuth() {
  return useAuthContext();
}
