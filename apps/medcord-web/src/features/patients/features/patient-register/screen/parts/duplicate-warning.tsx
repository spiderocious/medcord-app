import { Repeat } from 'meemaw';
import { AppButton } from '@medcord/ui';
import { IconAlert } from '@icons';
import type { Patient } from '../../../../shared/types/patient.ts';

interface DuplicateWarningProps {
  readonly duplicates: readonly Patient[];
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function DuplicateWarning({ duplicates, onConfirm, onCancel }: DuplicateWarningProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <IconAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900">Possible duplicate patient</p>
          <p className="mt-0.5 text-xs text-amber-700">
            {duplicates.length} existing patient{duplicates.length !== 1 ? 's' : ''} may match this registration. Review before continuing.
          </p>
        </div>
      </div>

      <div className="divide-y divide-forest-900/10 rounded-lg border border-forest-900/10 overflow-hidden">
        <Repeat each={duplicates as Patient[]}>
          {(p: Patient) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-white">
              <div>
                <p className="text-sm font-medium text-charcoal-900">
                  {p.demographics.firstName} {p.demographics.lastName}
                </p>
                <p className="text-xs text-charcoal-700/60">
                  {p.patientCode} · {new Date(p.demographics.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </Repeat>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={onCancel}>Go back</AppButton>
        <AppButton onClick={onConfirm}>Register anyway</AppButton>
      </div>
    </div>
  );
}
