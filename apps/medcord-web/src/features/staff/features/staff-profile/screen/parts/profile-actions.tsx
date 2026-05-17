import { Show, CopyToClipboard } from 'meemaw';

import { AppButton, DrawerService } from '@medcord/ui';
import { useGenerateResetCode } from '@features/auth/api/use-generate-reset-code.ts';
import type { StaffMember } from '../../../../shared/types/staff.ts';

interface ProfileActionsProps {
  readonly member: StaffMember;
  readonly currentUserRole: string | undefined;
  readonly currentUserId: string | undefined;
}

export function ProfileActions({ member, currentUserRole, currentUserId }: ProfileActionsProps) {
  const resetCodeMutation = useGenerateResetCode();

  function handleGenerateResetCode() {
    resetCodeMutation.mutate(
      { userId: member.userId },
      {
        onSuccess: (code) => {
          DrawerService.showCustomModal('Reset code generated', () => (
            <div className="space-y-4 text-center">
              <p className="text-sm text-charcoal-700">
                Share this code with the staff member. It expires in 24 hours and will not be shown again.
              </p>
              <CopyToClipboard text={code}>
                {(copy) => (
                  <button
                    onClick={copy}
                    className="mx-auto block font-mono text-3xl font-bold tracking-widest text-forest-900 hover:opacity-70 transition-opacity"
                  >
                    {code}
                  </button>
                )}
              </CopyToClipboard>
              <p className="text-xs text-charcoal-700/60">Click the code to copy it</p>
            </div>
          ));
        },
      },
    );
  }

  return (
    <Show when={currentUserRole === 'super_admin' && currentUserId !== member.userId}>
      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60 mb-3">
          Account
        </p>
        <AppButton
          variant="ghost"
          onClick={handleGenerateResetCode}
          loading={resetCodeMutation.isPending}
        >
          Generate reset code
        </AppButton>
      </div>
    </Show>
  );
}
