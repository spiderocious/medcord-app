import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppButton } from '@medcord/ui';
import { ROUTES } from '@shared/constants/routes.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';
import { useVerifyResetCode } from '../../../api/use-verify-reset-code.ts';

export function EnterCodeScreen() {
  const navigate = useNavigate();
  const mutation = useVerifyResetCode();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ code: code.trim().toUpperCase() });
      navigate(`${ROUTES.RESET_PASSWORD_NEW}?code=${encodeURIComponent(code.trim().toUpperCase())}`);
    } catch {
      setError('That code is invalid or has expired. Check with your super-admin.');
    }
  }

  return (
    <AuthLayout
      title="Enter your reset code"
      subtitle="Enter the 7-character code your super-admin gave you."
      footerLink={{ label: 'Back to', to: ROUTES.FORGOT_PASSWORD, text: 'forgot password' }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="reset-code" className="block text-sm font-medium text-charcoal-900">
            Reset code
          </label>
          <input
            id="reset-code"
            type="text"
            maxLength={7}
            autoComplete="off"
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm font-mono tracking-widest uppercase text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
            placeholder="A3K9PZ2"
          />
        </div>
        <Show when={error !== null}>
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        </Show>
        <AppButton type="submit" loading={mutation.isPending} className="w-full">
          Continue
        </AppButton>
      </form>
    </AuthLayout>
  );
}
