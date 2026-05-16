import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAdminLogin } from '../api/use-admin-auth.ts';
import { useAdminAuth } from '@shared/hooks/use-auth.ts';
import { ADMIN_ROUTES } from '@shared/constants/routes.ts';
import { AuthLayout } from './parts/auth-layout.tsx';
import { AdminLoginForm } from './parts/admin-login-form.tsx';

export function AdminLoginScreen() {
  const navigate = useNavigate();
  const { setTokens } = useAdminAuth();
  const mutation = useAdminLogin();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(email: string, password: string) {
    setError(null);
    mutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setTokens(data.tokens);
          void navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : 'Something went wrong.');
        },
      },
    );
  }

  return (
    <AuthLayout title="Sign in to your account">
      <AdminLoginForm
        onSubmit={handleSubmit}
        isLoading={mutation.isPending}
        error={error}
      />
    </AuthLayout>
  );
}
