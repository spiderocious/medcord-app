import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AppButton } from '@medcord/ui';
import { IconCheckCircle, IconEye, IconEyeOff } from '@icons';
import { parseApiError } from '@medcord/api';
import { ROUTES } from '@shared/constants/routes.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';
import { useResetPassword } from '../../../api/use-reset-password.ts';

export function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mutation = useResetPassword();

  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (token === '') {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }

    try {
      await mutation.mutateAsync({ token, newPassword });
      setDone(true);
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 2000);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-900/10">
            <IconCheckCircle size={22} className="text-forest-900" />
          </div>
          <p className="text-sm text-charcoal-700">
            Your password has been reset. Redirecting you to sign in…
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Make it strong — at least 8 characters."
      footerLink={{ label: 'Back to', to: ROUTES.LOGIN, text: 'Sign in' }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-charcoal-900">
            New password
          </label>
          <div className="relative mt-1">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-700"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>
        </div>

        {error !== null && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <AppButton type="submit" loading={mutation.isPending} className="w-full">
          Reset password
        </AppButton>
      </form>
    </AuthLayout>
  );
}
