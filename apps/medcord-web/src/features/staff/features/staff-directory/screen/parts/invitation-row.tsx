import { Repeat, Show, CopyToClipboard } from 'meemaw';

import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { IconSend, IconRefresh, IconClose, IconCopy, IconCheck } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Invitation } from '../../../../shared/types/staff.ts';

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

interface InvitationListProps {
  readonly invitations: readonly Invitation[];
  readonly resendMutation: UseMutationResult<unknown, Error, string, unknown>;
  readonly revokeMutation: UseMutationResult<unknown, Error, string, unknown>;
}

export function InvitationList({ invitations, resendMutation, revokeMutation }: InvitationListProps) {
  const pending = invitations.filter((inv) => inv.status === 'pending');

  function handleResend(inv: Invitation) {
    DrawerService.showConfirmationModal(
      'Resend invitation?',
      `A new invitation email will be sent to ${inv.email}. The previous link will be invalidated.`,
      {
        confirmButtonText: 'Resend',
        cancelButtonText: 'Cancel',
        onConfirm: () => {
          void resendMutation.mutateAsync(inv.id).then(() => {
            DrawerService.toast(`Invitation resent to ${inv.email}.`, { type: 'success' });
          }).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Failed to resend invitation.';
            DrawerService.toast(message, { type: 'error' });
          });
        },
      },
    );
  }

  function handleRevoke(inv: Invitation) {
    DrawerService.showConfirmationModal(
      'Revoke invitation?',
      `The invitation for ${inv.email} will be cancelled. They will no longer be able to join using the sent link.`,
      {
        kind: 'error',
        destructive: true,
        confirmButtonText: 'Revoke',
        cancelButtonText: 'Cancel',
        onConfirm: () => {
          void revokeMutation.mutateAsync(inv.id).then(() => {
            DrawerService.toast(`Invitation for ${inv.email} has been revoked.`, { type: 'info' });
          }).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Failed to revoke invitation.';
            DrawerService.toast(message, { type: 'error' });
          });
        },
      },
    );
  }

  return (
    <Show when={pending.length > 0}>
      <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-forest-900/10 px-5 py-3">
          <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
            Pending invitations
          </AppText>
          <span className="rounded-full bg-forest-900/10 px-2 py-0.5 text-xs font-semibold text-forest-900">
            {pending.length}
          </span>
        </div>
        <div className="divide-y divide-forest-900/10">
          <Repeat each={pending as Invitation[]}>
            {(inv: Invitation) => (
              <div
                key={inv.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-forest-900/10 bg-cream-50">
                    <IconSend size={12} className="text-charcoal-700/60" />
                  </div>
                  <div className="min-w-0">
                    <AppText variant="body-sm" as="p" className="truncate font-medium text-charcoal-900">
                      {inv.email}
                    </AppText>
                    <AppText variant="caption" as="p" className="normal-case tracking-normal text-charcoal-700">
                      {ROLE_LABELS[inv.role] ?? inv.role}
                      {inv.department !== undefined ? ` · ${inv.department}` : ''}
                    </AppText>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:shrink-0">
                  <CopyToClipboard
                    text={`${window.location.origin}${ROUTES.INVITATION_ACCEPT(inv.token)}`}
                    onSuccess={() => DrawerService.toast('Invite link copied.', { type: 'success' })}
                  >
                    {(copy: () => void, copied: boolean) => (
                      <AppButton
                        variant="ghost"
                        leadingIcon={copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                        onClick={copy}
                      >
                        {copied ? 'Copied' : 'Copy link'}
                      </AppButton>
                    )}
                  </CopyToClipboard>
                  <AppButton
                    variant="ghost"
                    leadingIcon={<IconRefresh size={13} />}
                    loading={resendMutation.isPending && resendMutation.variables === inv.id}
                    onClick={() => handleResend(inv)}
                  >
                    Resend
                  </AppButton>
                  <AppButton
                    variant="ghost"
                    leadingIcon={<IconClose size={13} />}
                    loading={revokeMutation.isPending && revokeMutation.variables === inv.id}
                    onClick={() => handleRevoke(inv)}
                  >
                    Revoke
                  </AppButton>
                </div>
              </div>
            )}
          </Repeat>
        </div>
      </div>
    </Show>
  );
}
