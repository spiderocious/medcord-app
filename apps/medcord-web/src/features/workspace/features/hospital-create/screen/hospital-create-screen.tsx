import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Switch, Case, Repeat } from 'meemaw';

import { parseApiError } from '@medcord/api';
import { AppText } from '@medcord/ui';
import { IconArrowLeft } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import {
  HospitalCreateProvider,
  useHospitalCreate,
} from '../providers/hospital-create-provider.tsx';
import { useCreateHospital } from '../api/use-create-hospital.ts';
import { StepBasicInfo } from './parts/step-basic-info.tsx';
import { StepReview } from './parts/step-review.tsx';

function StepIndicator({ current, total }: { readonly current: number; readonly total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <Repeat times={total}>
        {(_item: unknown, i: number) => (
          <div
            key={i}
            className={[
              'h-1.5 rounded-full transition-all',
              i + 1 === current
                ? 'w-6 bg-forest-900'
                : i + 1 < current
                  ? 'w-3 bg-forest-900/40'
                  : 'w-3 bg-forest-900/15',
            ].join(' ')}
          />
        )}
      </Repeat>
    </div>
  );
}

function HospitalCreateContent() {
  const navigate = useNavigate();
  const { step, draft } = useHospitalCreate();
  const createMutation = useCreateHospital();
  const [error, setError] = useState<string | null>(null);

  const STEP_LABELS: Record<1 | 2, string> = {
    1: 'Basic information',
    2: 'Review & create',
  };

  async function handleSubmit() {
    setError(null);
    try {
      await createMutation.mutateAsync({
        name: draft.name.trim(),
        type: draft.type,
        location: draft.location.trim(),
        subdomain: draft.subdomain,
        timezone: draft.timezone.trim(),
        ...(draft.phone.trim() !== '' || draft.email.trim() !== '' || draft.address.trim() !== ''
          ? {
              contact: {
                ...(draft.phone.trim() !== '' ? { phone: draft.phone.trim() } : {}),
                ...(draft.email.trim() !== '' ? { email: draft.email.trim() } : {}),
                ...(draft.address.trim() !== '' ? { address: draft.address.trim() } : {}),
              },
            }
          : {}),
      });
      navigate(ROUTES.HOSPITALS, { replace: true });
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-cream-50">
      {/* Topbar */}
      <header className="flex h-14 items-center gap-3 border-b border-forest-900/10 bg-white px-4 sm:px-6">
        <Link
          to={ROUTES.HOSPITALS}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-700 hover:bg-forest-900/5 transition-colors"
          aria-label="Back to workspaces"
        >
          <IconArrowLeft size={16} />
        </Link>
        <span className="text-sm font-semibold text-forest-900">Medcord</span>
        <div className="ml-auto">
          <StepIndicator current={step} total={2} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-10 sm:py-12">
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/50">
              Step {step} of 2
            </span>
          </div>
          <AppText variant="heading-2" className="text-charcoal-900">
            {STEP_LABELS[step]}
          </AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {step === 1
              ? 'Set up your hospital workspace.'
              : 'Review your details before creating.'}
          </AppText>
        </div>

        <div className="rounded-xl border border-forest-900/10 bg-white p-6 shadow-sm sm:p-8">
          <Switch>
            <Case when={step === 1}>
              <StepBasicInfo />
            </Case>
            <Case when={step === 2}>
              <StepReview
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
                error={error}
              />
            </Case>
          </Switch>
        </div>
      </main>
    </div>
  );
}

export function HospitalCreateScreen() {
  return (
    <HospitalCreateProvider>
      <HospitalCreateContent />
    </HospitalCreateProvider>
  );
}
