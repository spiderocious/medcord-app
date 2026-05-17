import { useNavigate } from 'react-router-dom';

import { AppButton } from '@medcord/ui';
import { ROUTES } from '@shared/constants/routes.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';

export function ForgotPasswordScreen() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Forgot your password?"
      footerLink={{ label: 'Back to', to: ROUTES.LOGIN, text: 'Sign in' }}
    >
      <div className="space-y-5 text-center">
        <p className="text-sm text-charcoal-700">
          Contact your hospital&apos;s super-admin to get a reset code. Once you have one, click below.
        </p>
        <AppButton onClick={() => navigate(ROUTES.RESET_PASSWORD)} className="w-full">
          I have a code
        </AppButton>
      </div>
    </AuthLayout>
  );
}
