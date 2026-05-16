import { useState } from 'react';

import { AppButton } from '@medcord/ui';
import { IconCheckCircle } from '@icons';
import { parseApiError } from '@medcord/api';
import { ROUTES } from '@shared/constants/routes.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';
import { useForgotPassword } from '../../../api/use-forgot-password.ts';

export function ForgotPasswordScreen() {
  const mutation = useForgotPassword();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ email });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        footerLink={{ label: 'Back to', to: ROUTES.LOGIN, text: 'Sign in' }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-900/10">
            <IconCheckCircle size={22} className="text-forest-900" />
          </div>
          <p className="text-sm text-charcoal-700">
            If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footerLink={{ label: 'Back to', to: ROUTES.LOGIN, text: 'Sign in' }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="fp-email" className="block text-sm font-medium text-charcoal-900">
            Email address
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
            placeholder="you@hospital.com"
          />
        </div>

        {error !== null && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <AppButton type="submit" loading={mutation.isPending} className="w-full">
          Send reset link
        </AppButton>
      </form>
    </AuthLayout>
  );
}
