import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loadable, Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconUserPlus, IconNetwork, IconUsers, IconChevronLeft, IconChevronRight } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalBySlug } from '@shared/api/use-hospital-by-slug.ts';
import { useStaff } from '../api/use-staff.ts';
import {
  useStaffInvitations,
  useResendInvitation,
  useRevokeInvitation,
} from '../api/use-staff-invitations.ts';
import { useStaffFilter } from '../utils/use-staff-filter.ts';
import { StaffFilters } from './parts/staff-filters.tsx';
import { StaffTable } from './parts/staff-table.tsx';
import { InvitationList } from './parts/invitation-row.tsx';

const PAGE_SIZE = 20;

export function StaffDirectoryScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: hospital } = useHospitalBySlug(slug);
  const hospitalId = hospital?.id ?? '';

  const { filter, setSearch, setRole, setStatus, reset: resetFilter } = useStaffFilter();
  const [page, setPage] = useState(1);

  function handleSearch(q: string) { setSearch(q); setPage(1); }
  function handleRole(role: Parameters<typeof setRole>[0]) { setRole(role); setPage(1); }
  function handleStatus(status: Parameters<typeof setStatus>[0]) { setStatus(status); setPage(1); }
  function handleReset() { resetFilter(); setPage(1); }

  const { data: staffData, isLoading, error } = useStaff(hospitalId, {
    q: filter.q !== '' ? filter.q : undefined,
    role: filter.role !== '' ? filter.role : undefined,
    status: filter.status !== '' ? filter.status : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const { data: invitations } = useStaffInvitations(hospitalId);
  const resendMutation = useResendInvitation(hospitalId);
  const revokeMutation = useRevokeInvitation(hospitalId);

  const members = staffData?.items ?? [];
  const total = staffData?.total ?? 0;
  const totalPages = staffData?.totalPages ?? 1;
  const currentPage = staffData?.page ?? page;
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Staff</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            Manage your team members, roles, and invitations.
          </AppText>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={ROUTES.HOSPITAL_ORG_CHART(slug)}>
            <AppButton variant="secondary" leadingIcon={<IconNetwork size={14} />}>
              Org chart
            </AppButton>
          </Link>
          <Link to={ROUTES.HOSPITAL_STAFF_INVITE(slug)}>
            <AppButton leadingIcon={<IconUserPlus size={14} />}>
              Invite
            </AppButton>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <StaffFilters
        filter={filter}
        onSearch={handleSearch}
        onRole={handleRole}
        onStatus={handleStatus}
        onReset={handleReset}
      />

      {/* Pending invitations */}
      <Show when={(invitations?.length ?? 0) > 0}>
        <InvitationList
          invitations={invitations ?? []}
          resendMutation={resendMutation}
          revokeMutation={revokeMutation}
        />
      </Show>

      {/* Staff list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
            Members · {total}
          </AppText>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-forest-900/5" />
              ))}
            </div>
          }
          errorComponent={
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load staff directory.
            </p>
          }
        >
          <Show
            when={members.length > 0}
            fallback={
              <div className="rounded-xl border border-forest-900/10 bg-white py-16 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-forest-900/10 bg-cream-50">
                  <IconUsers size={22} className="text-charcoal-700/40" />
                </div>
                <AppText variant="heading-3" className="text-charcoal-900">No staff yet</AppText>
                <AppText variant="body-sm" className="mt-1 mb-6 text-charcoal-700">
                  Invite your first team member to get started.
                </AppText>
                <Link to={ROUTES.HOSPITAL_STAFF_INVITE(slug)}>
                  <AppButton leadingIcon={<IconUserPlus size={14} />}>
                    Invite staff
                  </AppButton>
                </Link>
              </div>
            }
          >
            <StaffTable
              slug={slug}
              hospitalId={hospitalId}
              members={members}
            />

            <Show when={totalPages > 1}>
              <div className="flex items-center justify-between border-t border-forest-900/10 bg-white px-5 py-3 rounded-b-xl -mt-px">
                <AppText variant="caption" className="normal-case tracking-normal text-charcoal-700/60">
                  {from}–{to} of {total} members
                </AppText>
                <div className="flex items-center gap-1">
                  <AppButton
                    variant="ghost"
                    leadingIcon={<IconChevronLeft size={14} />}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <span className="hidden sm:inline">Previous</span>
                  </AppButton>
                  <AppText variant="caption" className="px-2 normal-case tracking-normal text-charcoal-700">
                    {currentPage} / {totalPages}
                  </AppText>
                  <AppButton
                    variant="ghost"
                    trailingIcon={<IconChevronRight size={14} />}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <span className="hidden sm:inline">Next</span>
                  </AppButton>
                </div>
              </div>
            </Show>
          </Show>
        </Loadable>
      </div>
    </div>
  );
}
