import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loadable, Show } from 'meemaw';

import { AppButton, DrawerService } from '@medcord/ui';
import { IconArrowLeft } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useHospitalBySlug } from '@shared/api/use-hospital-by-slug.ts';
import { useStaffMember } from '../api/use-staff-member.ts';
import { useMyMembership } from '../api/use-my-membership.ts';
import {
  useSuspendStaff,
  useActivateStaff,
  useRemoveStaff,
} from '../api/use-update-staff.ts';
import { ProfileHeader } from './parts/profile-header.tsx';
import { ProfileInfo } from './parts/profile-info.tsx';
import { ProfileMeta } from './parts/profile-meta.tsx';
import { ProfileActions } from './parts/profile-actions.tsx';

export function StaffProfileScreen() {
  const { slug = '', staffId = '' } = useParams<{ slug: string; staffId: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { data: hospital } = useHospitalBySlug(slug);
  const hospitalId = hospital?.id ?? '';

  const { data: member, isLoading, error } = useStaffMember(hospitalId, staffId);
  const { data: myMembership } = useMyMembership(hospitalId);

  const suspendMutation = useSuspendStaff(hospitalId);
  const activateMutation = useActivateStaff(hospitalId);
  const removeMutation = useRemoveStaff(hospitalId);

  function handleSuspend() {
    const name = member?.name ?? 'this staff member';
    DrawerService.showConfirmationModal(
      'Suspend staff member?',
      `${name} will lose access to the hospital immediately. You can reactivate them at any time.`,
      {
        kind: 'warning',
        confirmButtonText: 'Suspend',
        cancelButtonText: 'Cancel',
        onConfirm: () => {
          void suspendMutation.mutateAsync(staffId).then(() => {
            DrawerService.toast(`${name} has been suspended.`, { type: 'warning' });
          }).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Failed to suspend staff member.';
            DrawerService.toast(message, { type: 'error' });
          });
        },
      },
    );
  }

  function handleActivate() {
    const name = member?.name ?? 'this staff member';
    DrawerService.showConfirmationModal(
      'Reactivate staff member?',
      `${name} will regain access to the hospital and all their previous permissions.`,
      {
        confirmButtonText: 'Reactivate',
        cancelButtonText: 'Cancel',
        onConfirm: () => {
          void activateMutation.mutateAsync(staffId).then(() => {
            DrawerService.toast(`${name} has been reactivated.`, { type: 'success' });
          }).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Failed to reactivate staff member.';
            DrawerService.toast(message, { type: 'error' });
          });
        },
      },
    );
  }

  function handleRemove() {
    const name = member?.name ?? 'this staff member';
    DrawerService.showConfirmationModal(
      'Remove staff member?',
      `${name} will be permanently removed from this hospital. This action cannot be undone.`,
      {
        kind: 'error',
        destructive: true,
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        onConfirm: () => {
          void removeMutation.mutateAsync(staffId).then(() => {
            DrawerService.toast(`${name} has been removed.`, { type: 'info' });
            navigate(ROUTES.HOSPITAL_STAFF(slug));
          }).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Failed to remove staff member.';
            DrawerService.toast(message, { type: 'error' });
          });
        },
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Back nav */}
      <div>
        <Link to={ROUTES.HOSPITAL_STAFF(slug)}>
          <AppButton variant="ghost" leadingIcon={<IconArrowLeft size={14} />}>
            Back to staff
          </AppButton>
        </Link>
      </div>

      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-xl bg-forest-900/5" />
            <div className="h-48 animate-pulse rounded-xl bg-forest-900/5" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load staff profile.
          </p>
        }
      >
        <Show when={member !== undefined}>
          <div className="space-y-4">
            <ProfileHeader
              member={member!}
              onSuspend={handleSuspend}
              onActivate={handleActivate}
              onRemove={handleRemove}
            />
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <ProfileInfo member={member!} />
              <div className="space-y-4">
                <ProfileMeta member={member!} />
                <ProfileActions
                  member={member!}
                  currentUserRole={myMembership?.role}
                  currentUserId={user?.id}
                />
              </div>
            </div>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
