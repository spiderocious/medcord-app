import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconEye, IconEyeOff, IconBuilding, IconLock } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { AuthLayout } from '@features/auth/shared/parts/auth-layout.tsx';
import { useInvitationDetails } from '../api/use-invitation-details.ts';
import { useAcceptInvitation } from '../api/use-accept-invitation.ts';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  hospital_admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  nurse_practitioner: 'Nurse Practitioner',
  physician_assistant: 'Physician Assistant',
  lab_tech: 'Lab Tech',
  pharmacist: 'Pharmacist',
  reception: 'Reception',
  tech: 'Tech',
  custom: 'Custom',
};

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

export function AcceptInviteScreen() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuth();

  const { data, isLoading, error } = useInvitationDetails(token);
  const acceptMutation = useAcceptInvitation(token);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setAlreadyExists(false);

    try {
      const result = await acceptMutation.mutateAsync({ name, password });
      setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      setUser({
        id: '',
        email: data?.invitation.email ?? '',
        name,
        isEmailVerified: true,
        twoFactorEnabled: false,
        createdAt: '',
        updatedAt: '',
      });
      navigate(ROUTES.HOSPITAL_DASHBOARD(result.hospitalSlug), { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      if (message.toLowerCase().includes('already exists')) {
        setAlreadyExists(true);
      }
      setSubmitError(message);
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <AuthLayout title="You've been invited">
        <div className="space-y-3 animate-pulse">
          <div className="h-16 rounded-lg bg-forest-900/5" />
          <div className="h-4 w-2/3 rounded bg-forest-900/5" />
          <div className="h-4 w-1/2 rounded bg-forest-900/5" />
          <div className="h-10 rounded-lg bg-forest-900/5 mt-4" />
          <div className="h-10 rounded-lg bg-forest-900/5" />
        </div>
      </AuthLayout>
    );
  }

  // Dead-end error — invalid / expired / already used token
  if (error != null || data == null) {
    const message = error instanceof Error ? error.message : 'This invitation link is invalid.';
    return (
      <AuthLayout title="Invitation unavailable">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <IconLock size={20} className="text-red-500" />
          </div>
          <AppText variant="body-sm" className="text-charcoal-700">
            {message}
          </AppText>
          <AppText variant="caption" className="normal-case tracking-normal text-charcoal-700/60">
            Ask the person who invited you to send a new invitation.
          </AppText>
          <Link to={ROUTES.LOGIN}>
            <AppButton variant="secondary" className="w-full mt-2">
              Go to sign in
            </AppButton>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const { invitation, hospital, invitedBy } = data;
  const roleLabel = ROLE_LABELS[invitation.role] ?? invitation.role;
  const roleLine = invitation.department != null
    ? `${roleLabel} · ${invitation.department}`
    : roleLabel;
  const expiresAt = new Date(invitation.expiresAt).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <AuthLayout
      title="You've been invited"
      subtitle={`Invited by ${invitedBy.name ?? 'Unknown'} · Expires ${expiresAt}`}
    >
      <div className="space-y-5">
        {/* Hospital card */}
        <div className="flex items-center gap-3 rounded-lg border border-forest-900/10 bg-cream-50 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-forest-900/10 bg-white">
            <IconBuilding size={16} className="text-charcoal-700/60" />
          </div>
          <div className="min-w-0">
            <AppText variant="body-sm" as="p" className="font-semibold text-charcoal-900 truncate">
              {hospital.name}
            </AppText>
            <AppText variant="caption" as="p" className="normal-case tracking-normal text-charcoal-700/60 truncate">
              {hospital.location}
            </AppText>
          </div>
        </div>

        {/* Role badge */}
        <AppText variant="caption" className="normal-case tracking-normal text-charcoal-700">
          Joining as <span className="font-semibold text-charcoal-900">{roleLine}</span>
        </AppText>

        {/* Form */}
        <form onSubmit={(e) => { void handleSubmit(e); }} noValidate className="space-y-4">
          {/* Email — read-only */}
          <div>
            <label htmlFor="ai-email" className="block text-sm font-medium text-charcoal-900">
              Email address
            </label>
            <input
              id="ai-email"
              type="email"
              value={invitation.email}
              readOnly
              className={`${INPUT_CLS} cursor-default bg-forest-900/5 text-charcoal-700`}
            />
          </div>

          {/* Full name */}
          <div>
            <label htmlFor="ai-name" className="block text-sm font-medium text-charcoal-900">
              Full name
            </label>
            <input
              id="ai-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={acceptMutation.isPending}
              className={INPUT_CLS}
              placeholder="Your full name"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="ai-password" className="block text-sm font-medium text-charcoal-900">
              Create a password
            </label>
            <div className="relative mt-1">
              <input
                id="ai-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={acceptMutation.isPending}
                className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50"
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

          <Show when={submitError !== null}>
            <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 space-y-1">
              <AppText variant="body-sm" as="p">{submitError}</AppText>
              <Show when={alreadyExists}>
                <Link
                  to={`${ROUTES.LOGIN}?next=${encodeURIComponent(ROUTES.INVITATION_ACCEPT(token))}`}
                  className="font-medium underline"
                >
                  Sign in instead →
                </Link>
              </Show>
            </div>
          </Show>

          <AppButton
            type="submit"
            loading={acceptMutation.isPending}
            className="w-full"
          >
            Accept invitation
          </AppButton>
        </form>
      </div>
    </AuthLayout>
  );
}
