import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppButton } from '@medcord/ui';
import { IconCheckCircle, IconEye, IconEyeOff } from '@icons';
import { parseApiError } from '@medcord/api';
import { ROUTES } from '@shared/constants/routes.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';
import { useResetPassword } from '../../../api/use-reset-password.ts';

export function NewPasswordScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mutation = useResetPassword();
  const code = searchParams.get('code') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!code) { setError('Missing reset code. Go back and re-enter it.'); return; }
    try {
      await mutation.mutateAsync({ code, password });
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
          <p className="text-sm text-charcoal-700">Your password has been reset. Redirecting you to sign in…</p>
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
          <label htmlFor="new-pw" className="block text-sm font-medium text-charcoal-900">New password</label>
          <div className="relative mt-1">
            <input
              id="new-pw"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-700"
              tabIndex={-1}
            >
              <Show when={showPw} fallback={<IconEye size={16} />}>
                <IconEyeOff size={16} />
              </Show>
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-pw" className="block text-sm font-medium text-charcoal-900">Confirm password</label>
          <div className="relative mt-1">
            <input
              id="confirm-pw"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
              placeholder="Repeat your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-700"
              tabIndex={-1}
            >
              <Show when={showConfirm} fallback={<IconEye size={16} />}>
                <IconEyeOff size={16} />
              </Show>
            </button>
          </div>
        </div>
        <Show when={error !== null}>
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        </Show>
        <AppButton type="submit" loading={mutation.isPending} className="w-full">
          Reset password
        </AppButton>
      </form>
    </AuthLayout>
  );
}
