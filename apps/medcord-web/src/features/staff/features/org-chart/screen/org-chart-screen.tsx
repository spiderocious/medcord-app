import { Link, useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconArrowLeft, IconUsers } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalBySlug } from '@shared/api/use-hospital-by-slug.ts';
import type { OrgChartNode } from '../../../shared/types/staff.ts';
import { useOrgChart } from '../api/use-org-chart.ts';

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

interface MemberRowProps {
  readonly node: OrgChartNode;
  readonly isReport: boolean;
}

function MemberRow({ node, isReport }: MemberRowProps) {
  return (
    <div className={['flex items-center gap-3 rounded-xl border border-forest-900/10 bg-white px-4 py-3 shadow-sm', isReport ? 'ml-8' : ''].join(' ')}>
      <Show when={isReport}>
        <div className="absolute -left-4 top-1/2 h-px w-4 bg-forest-900/10" />
      </Show>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-xs font-semibold text-white">
        {(ROLE_LABELS[node.role] ?? node.role).slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <AppText variant="body-sm" as="p" className="truncate font-medium text-charcoal-900">
          {ROLE_LABELS[node.role] ?? node.role}
        </AppText>
        <AppText variant="caption" as="p" className="normal-case tracking-normal text-charcoal-700">
          {node.department ?? 'No department'}
          {node.managerId !== undefined ? ' · Has manager' : ' · Top-level'}
        </AppText>
      </div>
      <AppText variant="caption" as="span" className="normal-case tracking-normal text-charcoal-700/40 shrink-0">
        {node.id.slice(0, 6).toUpperCase()}
      </AppText>
    </div>
  );
}

export function OrgChartScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: hospital } = useHospitalBySlug(slug);
  const hospitalId = hospital?.id ?? '';

  const { data: chart, isLoading, error } = useOrgChart(hospitalId);
  const members = chart ?? [];

  const topLevel = members.filter((m) => m.managerId === undefined);
  const reports = members.filter((m) => m.managerId !== undefined);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link to={ROUTES.HOSPITAL_STAFF(slug)}>
          <AppButton variant="ghost" leadingIcon={<IconArrowLeft size={14} />}>
            Back to staff
          </AppButton>
        </Link>
      </div>

      <div>
        <AppText variant="heading-1" className="text-charcoal-900">Org chart</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Reporting structure for {hospital?.name ?? 'your hospital'}.
        </AppText>
      </div>

      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-forest-900/5" />
            ))}
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load org chart.
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
              <AppText variant="heading-3" className="text-charcoal-900">No hierarchy yet</AppText>
              <AppText variant="body-sm" className="mt-1 mb-6 text-charcoal-700">
                Assign managers to staff members to build the org chart.
              </AppText>
              <Link to={ROUTES.HOSPITAL_STAFF(slug)}>
                <AppButton>Go to staff directory</AppButton>
              </Link>
            </div>
          }
        >
          <div className="space-y-6">
            <Show when={topLevel.length > 0}>
              <div>
                <AppText variant="caption" className="mb-3 block font-semibold uppercase text-charcoal-700/60">
                  Top-level · {topLevel.length}
                </AppText>
                <div className="space-y-2">
                  <Repeat each={topLevel as OrgChartNode[]}>
                    {(node: OrgChartNode) => (
                      <MemberRow key={node.id} node={node} isReport={false} />
                    )}
                  </Repeat>
                </div>
              </div>
            </Show>

            <Show when={reports.length > 0}>
              <div>
                <AppText variant="caption" className="mb-3 block font-semibold uppercase text-charcoal-700/60">
                  With managers · {reports.length}
                </AppText>
                <div className="space-y-2">
                  <Repeat each={reports as OrgChartNode[]}>
                    {(node: OrgChartNode) => (
                      <MemberRow key={node.id} node={node} isReport={true} />
                    )}
                  </Repeat>
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
