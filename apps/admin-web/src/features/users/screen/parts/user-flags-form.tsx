import { useState } from 'react';
import { DrawerService, AppButton } from '@medcord/ui';

import type { AdminUser } from '@shared/types/admin.ts';
import { useUpdateAdminUser, useDisableAdminUser } from '../../api/use-admin-users.ts';
import { useAdminAuth } from '@shared/hooks/use-auth.ts';

interface UserFlagsFormProps {
  readonly user: AdminUser;
}

export function UserFlagsForm({ user }: UserFlagsFormProps) {
  const { user: currentUser } = useAdminAuth();
  const updateMutation = useUpdateAdminUser(user.id);
  const disableMutation = useDisableAdminUser(user.id);

  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [isEmailVerified, setIsEmailVerified] = useState(user.isEmailVerified);

  function handleSaveFlags() {
    const isSelfDemotion = currentUser?.id === user.id && user.isAdmin && !isAdmin;

    if (isSelfDemotion) {
      DrawerService.showConfirmationModal(
        'Remove your own admin access?',
        'You will be logged out and unable to return.',
        {
          destructive: true,
          onConfirm: () => {
            updateMutation.mutate(
              { isAdmin, isEmailVerified },
              {
                onSuccess: () => {
                  DrawerService.toast('User updated.', { type: 'success' });
                },
              },
            );
          },
        },
      );
      return;
    }

    updateMutation.mutate(
      { isAdmin, isEmailVerified },
      {
        onSuccess: () => {
          DrawerService.toast('User updated.', { type: 'success' });
        },
      },
    );
  }

  function handleDisableSessions() {
    DrawerService.showConfirmationModal(
      'Disable all sessions?',
      'This will invalidate all active sessions for this user. They will need to log in again.',
      {
        destructive: true,
        onConfirm: () => {
          disableMutation.mutate();
        },
      },
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
          Platform flags
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              disabled={updateMutation.isPending}
              className="h-4 w-4 rounded border-forest-900/30 text-forest-900 focus:ring-forest-900"
            />
            <span className="text-sm text-charcoal-900">Platform admin</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isEmailVerified}
              onChange={(e) => setIsEmailVerified(e.target.checked)}
              disabled={updateMutation.isPending}
              className="h-4 w-4 rounded border-forest-900/30 text-forest-900 focus:ring-forest-900"
            />
            <span className="text-sm text-charcoal-900">Email verified</span>
          </label>
        </div>
        <AppButton
          variant="secondary"
          onClick={handleSaveFlags}
          loading={updateMutation.isPending}
        >
          Save flags
        </AppButton>
      </div>

      <div className="border-t border-forest-900/10 pt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600/70">
          Session control
        </p>
        <AppButton
          variant="danger"
          onClick={handleDisableSessions}
          loading={disableMutation.isPending}
        >
          Disable all sessions
        </AppButton>
      </div>
    </div>
  );
}
