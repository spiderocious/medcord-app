import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconCheckCircle, IconLoader, IconShield } from '@icons';
import { parseApiError } from '@medcord/api';
import { ROUTES } from '@shared/constants/routes.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';
import { useSetup2fa } from '../../../api/use-setup-2fa.ts';
import { useVerify2fa } from '../../../api/use-verify-2fa.ts';

type Step = 'intro' | 'qr' | 'verify' | 'done';

export function Setup2faScreen() {
  const navigate = useNavigate();
  const setupMutation = useSetup2fa();
  const verifyMutation = useVerify2fa();

  const [step, setStep] = useState<Step>('intro');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const qrImageUrl = otpauthUrl !== ''
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    : '';

  async function handleStart() {
    setError(null);
    try {
      const result = await setupMutation.mutateAsync();
      setOtpauthUrl(result.otpauthUrl);
      setStep('qr');
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await verifyMutation.mutateAsync({ totpCode: code });
      setStep('done');
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  if (step === 'done') {
    return (
      <AuthLayout title="Two-factor authentication enabled">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-900/10">
            <IconCheckCircle size={28} className="text-forest-900" />
          </div>
          <AppText variant="body-sm" className="text-charcoal-700">
            Your account is now protected with two-factor authentication.
          </AppText>
          <AppButton onClick={() => navigate(ROUTES.HOSPITALS, { replace: true })} className="w-full">
            Continue to Medcord
          </AppButton>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'qr') {
    return (
      <AuthLayout title="Scan this QR code">
        <div className="space-y-4">
          <p className="text-sm text-charcoal-700">
            Open your authenticator app (Google Authenticator, Authy, etc.) and scan the code below.
          </p>

          <div className="flex justify-center">
            <Show
              when={qrImageUrl !== ''}
              fallback={
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-forest-900/10 bg-cream-50">
                  <IconLoader size={24} className="animate-spin text-charcoal-700" />
                </div>
              }
            >
              <img src={qrImageUrl} alt="2FA QR code" className="h-48 w-48 rounded-lg border border-forest-900/10" />
            </Show>
          </div>

          <p className="text-xs text-charcoal-700 text-center">
            Can't scan? Use this URL in your app manually.
          </p>

          <AppButton onClick={() => setStep('verify')} className="w-full">
            I've scanned it — continue
          </AppButton>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'verify') {
    return (
      <AuthLayout title="Confirm your setup">
        <form onSubmit={handleVerify} noValidate className="space-y-4">
          <p className="text-sm text-charcoal-700">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>

          <div>
            <label htmlFor="setup-totp" className="block text-sm font-medium text-charcoal-900">
              Authentication code
            </label>
            <input
              id="setup-totp"
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

          <Show when={error !== null}>
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          </Show>

          <AppButton type="submit" loading={verifyMutation.isPending} className="w-full">
            Verify and activate
          </AppButton>

          <button
            type="button"
            onClick={() => setStep('qr')}
            className="w-full text-center text-sm text-charcoal-700 hover:text-forest-900"
          >
            Back to QR code
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Secure your account"
      subtitle="Two-factor authentication adds an extra layer of security."
      footerLink={{ label: 'Set this up later from', to: ROUTES.HOSPITALS, text: 'your account' }}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-900/10">
            <IconShield size={28} className="text-forest-900" />
          </div>
          <AppText variant="body-sm" className="text-charcoal-700">
            You'll need an authenticator app on your phone. We recommend Google Authenticator or Authy.
          </AppText>
        </div>

        <Show when={error !== null}>
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        </Show>

        <AppButton onClick={handleStart} loading={setupMutation.isPending} className="w-full">
          Set up two-factor authentication
        </AppButton>
      </div>
    </AuthLayout>
  );
}
