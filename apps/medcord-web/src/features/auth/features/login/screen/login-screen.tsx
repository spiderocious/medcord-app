import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { parseApiError } from '@medcord/api';
import { ROUTES } from '@shared/constants/routes.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';
import { useLogin } from '../../../api/use-login.ts';
import { LoginForm } from '../parts/login-form.tsx';
import { TwoFaStep } from '../parts/two-fa-step.tsx';

type Step = 'credentials' | 'totp';

export function LoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setTokens } = useAuth();

  const nextUrl = searchParams.get('next') ?? ROUTES.HOSPITALS;
  const loginMutation = useLogin();

  const [step, setStep] = useState<Step>('credentials');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCredentials(email: string, password: string) {
    setError(null);
    setPendingEmail(email);
    setPendingPassword(password);

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      setTokens(result.tokens);
      setUser({ ...result.user, isEmailVerified: true, twoFactorEnabled: false, createdAt: '', updatedAt: '' });
      navigate(nextUrl, { replace: true });
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      if (parsed.code === 'two_factor_required') {
        setStep('totp');
      } else {
        setError(parsed.message);
      }
    }
  }

  async function handleTotp(totpCode: string) {
    setError(null);
    try {
      const result = await loginMutation.mutateAsync({
        email: pendingEmail,
        password: pendingPassword,
        totpCode,
      });
      setTokens(result.tokens);
      setUser({ ...result.user, isEmailVerified: true, twoFactorEnabled: true, createdAt: '', updatedAt: '' });
      navigate(nextUrl, { replace: true });
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  if (step === 'totp') {
    return (
      <AuthLayout title="Two-factor authentication">
        <TwoFaStep
          onSubmit={handleTotp}
          onBack={() => { setStep('credentials'); setError(null); }}
          isLoading={loginMutation.isPending}
          error={error}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign in to Medcord"
      subtitle="Enter your credentials to access your hospital workspace."
      footerLink={{ label: "Don't have an account?", to: ROUTES.REGISTER, text: 'Create one' }}
    >
      <LoginForm
        onSubmit={handleCredentials}
        isLoading={loginMutation.isPending}
        error={error}
      />
    </AuthLayout>
  );
}
