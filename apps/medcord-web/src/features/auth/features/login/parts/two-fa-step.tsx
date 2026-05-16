import { useState } from 'react';

import { AppButton } from '@medcord/ui';
import { IconLock } from '@icons';

interface TwoFaStepProps {
  readonly onSubmit: (totpCode: string) => void;
  readonly onBack: () => void;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function TwoFaStep({ onSubmit, onBack, isLoading, error }: TwoFaStepProps) {
  const [code, setCode] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(code);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-900/10">
          <IconLock size={20} className="text-forest-900" />
        </div>
        <p className="text-sm text-charcoal-700">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      <div>
        <label htmlFor="totp" className="block text-sm font-medium text-charcoal-900">
          Authentication code
        </label>
        <input
          id="totp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-center text-lg tracking-widest text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
          placeholder="000000"
        />
      </div>

      {error !== null && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <AppButton type="submit" loading={isLoading} className="w-full">
        Verify
      </AppButton>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-charcoal-700 hover:text-forest-900"
      >
        Back to sign in
      </button>
    </form>
  );
}
