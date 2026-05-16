import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { parseApiError } from '@medcord/api';
import { ROUTES } from '@shared/constants/routes.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';
import { useRegister } from '../../../api/use-register.ts';
import { RegisterForm } from '../parts/register-form.tsx';

export function RegisterScreen() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuth();
  const registerMutation = useRegister();

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  async function handleSubmit(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    setError(null);
    setFieldErrors(null);

    try {
      const result = await registerMutation.mutateAsync(data);
      setTokens(result.tokens);
      setUser({
        ...result.user,
        isEmailVerified: false,
        twoFactorEnabled: false,
        createdAt: '',
        updatedAt: '',
      });
      navigate(ROUTES.HOSPITALS, { replace: true });
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      if (parsed.field_errors !== undefined) {
        const flat: Record<string, string> = {};
        for (const [field, messages] of Object.entries(parsed.field_errors)) {
          flat[field] = messages[0] ?? parsed.message;
        }
        setFieldErrors(flat);
      } else {
        setError(parsed.message);
      }
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started — you can add your hospital workspace after signing up."
      footerLink={{ label: 'Already have an account?', to: ROUTES.LOGIN, text: 'Sign in' }}
    >
      <RegisterForm
        onSubmit={handleSubmit}
        isLoading={registerMutation.isPending}
        fieldErrors={fieldErrors}
        error={error}
      />
    </AuthLayout>
  );
}
