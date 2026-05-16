import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconBuilding, IconMapPin, IconLink, IconInfo, IconSend, IconArrowLeft } from '@icons';
import { useHospitalCreate } from '../../providers/hospital-create-provider.tsx';

interface ReviewRowProps {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}

function ReviewRow({ label, value, mono = false }: ReviewRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <AppText variant="caption" as="span" className="shrink-0 normal-case tracking-normal text-charcoal-700">
        {label}
      </AppText>
      <span className={['text-right text-sm text-charcoal-900', mono ? 'font-mono' : 'font-medium'].join(' ')}>
        {value}
      </span>
    </div>
  );
}

interface StepReviewProps {
  readonly onSubmit: () => Promise<void>;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function StepReview({ onSubmit, isLoading, error }: StepReviewProps) {
  const { draft, goBack } = useHospitalCreate();

  const hasContact =
    draft.phone.trim() !== '' ||
    draft.email.trim() !== '' ||
    draft.address.trim() !== '';

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="rounded-xl border border-forest-900/10 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-forest-900/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-forest-900/10 bg-cream-50">
            <IconBuilding size={18} className="text-forest-900/60" />
          </div>
          <div>
            <AppText variant="body-sm" as="p" className="font-semibold text-charcoal-900">{draft.name}</AppText>
            <AppText variant="caption" as="p" className="mt-0.5 normal-case tracking-normal text-charcoal-700">{draft.type}</AppText>
          </div>
        </div>

        <div className="divide-y divide-forest-900/10 px-5">
          <ReviewRow label="Location" value={draft.location} />
          <div className="flex items-start justify-between gap-4 py-3">
            <AppText variant="caption" as="span" className="shrink-0 normal-case tracking-normal text-charcoal-700 flex items-center gap-1.5">
              <IconLink size={12} />
              URL
            </AppText>
            <span className="font-mono text-right text-sm text-charcoal-900">
              {draft.subdomain}.medcord.app
            </span>
          </div>
          <ReviewRow label="Timezone" value={draft.timezone} />
        </div>

        <Show when={hasContact}>
          <div className="border-t border-forest-900/10 divide-y divide-forest-900/10 px-5">
            <Show when={draft.phone.trim() !== ''}>
              <div className="flex items-center gap-2 py-3 text-sm text-charcoal-700">
                <IconInfo size={13} className="shrink-0" />
                {draft.phone}
              </div>
            </Show>
            <Show when={draft.email.trim() !== ''}>
              <div className="flex items-center gap-2 py-3 text-sm text-charcoal-700">
                <IconSend size={13} className="shrink-0" />
                {draft.email}
              </div>
            </Show>
            <Show when={draft.address.trim() !== ''}>
              <div className="flex items-center gap-2 py-3 text-sm text-charcoal-700">
                <IconMapPin size={13} className="shrink-0" />
                {draft.address}
              </div>
            </Show>
          </div>
        </Show>
      </div>

      <Show when={error !== null}>
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </Show>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <AppButton
          loading={isLoading}
          onClick={() => { void onSubmit(); }}
          className="flex-1 sm:flex-none"
        >
          Create hospital
        </AppButton>
        <AppButton
          variant="secondary"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={goBack}
          disabled={isLoading}
        >
          Back
        </AppButton>
      </div>
    </div>
  );
}
