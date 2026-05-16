import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconAlert, IconTrash } from '@icons';
import { parseApiError } from '@medcord/api';
import { ROUTES } from '@shared/constants/routes.ts';
import type { Hospital } from '@shared/types/hospital.ts';
import { useArchiveHospital } from '../../api/use-archive-hospital.ts';

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50';

interface SettingsDangerZoneProps {
  readonly hospital: Hospital;
}

export function SettingsDangerZone({ hospital }: SettingsDangerZoneProps) {
  const navigate = useNavigate();
  const mutation = useArchiveHospital(hospital.id);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmName.trim() === hospital.name.trim();

  async function handleArchive() {
    setError(null);
    try {
      await mutation.mutateAsync();
      navigate(ROUTES.HOSPITALS, { replace: true });
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <AppText variant="heading-3" className="text-charcoal-900">Danger Zone</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Destructive actions that cannot be easily undone.
        </AppText>
      </div>

      <div className="rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <IconAlert size={16} className="text-red-600" />
            </div>
            <div>
              <AppText variant="body-sm" as="p" className="font-semibold text-charcoal-900">
                Archive hospital
              </AppText>
              <AppText variant="caption" as="p" className="mt-0.5 normal-case tracking-normal text-charcoal-700">
                This will archive the workspace and remove access for all staff. Data is retained but the workspace becomes read-only.
              </AppText>
            </div>
          </div>
          <Show
            when={!showConfirm}
            fallback={null}
          >
            <AppButton
              variant="danger"
              leadingIcon={<IconTrash size={14} />}
              onClick={() => setShowConfirm(true)}
            >
              Archive
            </AppButton>
          </Show>
        </div>

        <Show when={showConfirm}>
          <div className="border-t border-red-100 bg-red-50 p-5 space-y-4 sm:p-6">
            <p className="text-sm text-red-700">
              This action is irreversible. Type <strong className="font-semibold">{hospital.name}</strong> to confirm.
            </p>
            <div>
              <label htmlFor="sdz-confirm" className="block text-sm font-medium text-charcoal-900">
                Hospital name
              </label>
              <input
                id="sdz-confirm"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                disabled={mutation.isPending}
                className={INPUT_CLS}
                placeholder={hospital.name}
              />
            </div>

            <Show when={error !== null}>
              <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
            </Show>

            <div className="flex items-center gap-3">
              <AppButton
                variant="danger"
                leadingIcon={<IconTrash size={14} />}
                loading={mutation.isPending}
                disabled={!canDelete}
                onClick={() => { void handleArchive(); }}
              >
                Archive permanently
              </AppButton>
              <AppButton
                variant="ghost"
                onClick={() => { setShowConfirm(false); setConfirmName(''); setError(null); }}
                disabled={mutation.isPending}
              >
                Cancel
              </AppButton>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
