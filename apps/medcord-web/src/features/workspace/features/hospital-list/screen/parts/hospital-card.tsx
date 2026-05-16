import { Link } from 'react-router-dom';
import { Show, Repeat } from 'meemaw';

import { AppText } from '@medcord/ui';
import { IconBuilding, IconMapPin, IconChevronRight } from '@icons';
import type { Hospital } from '@shared/types/hospital.ts';
import { ROUTES } from '@shared/constants/routes.ts';

interface ReadonlyProps {
  readonly hospital: Hospital;
}

const HOSPITAL_TYPE_LABELS: Record<Hospital['type'], string> = {
  general: 'General Hospital',
  specialty: 'Specialty Hospital',
  clinic: 'Clinic',
  teaching: 'Teaching Hospital',
  other: 'Hospital',
};

const MODULE_LABELS: Record<string, string> = {
  emr: 'EMR',
  labs: 'Labs',
  assets: 'Assets',
  onlineConsultation: 'Teleconsult',
};

export function HospitalCard({ hospital }: ReadonlyProps) {
  const enabledModules = Object.entries(hospital.modules)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  return (
    <Link
      to={ROUTES.HOSPITAL_DASHBOARD(hospital.subdomain)}
      className="group block w-full"
    >
      <div className="flex items-start gap-4 rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-px hover:border-forest-900/20 hover:shadow-md">
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-forest-900/10 bg-cream-50">
          <Show
            when={hospital.logoKey != null}
            fallback={<IconBuilding size={22} className="text-forest-900/60" />}
          >
            <img
              src={`/assets/${hospital.logoKey}`}
              alt={hospital.name}
              className="h-10 w-10 rounded-md object-contain"
            />
          </Show>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <AppText
                variant="body-sm"
                as="p"
                className="truncate font-semibold text-charcoal-900"
              >
                {hospital.name}
              </AppText>
              <AppText variant="caption" as="p" className="mt-0.5 normal-case tracking-normal text-charcoal-700">
                {HOSPITAL_TYPE_LABELS[hospital.type]}
              </AppText>
            </div>
            <IconChevronRight
              size={16}
              className="mt-0.5 flex-shrink-0 text-charcoal-700/40 transition-transform group-hover:translate-x-0.5"
            />
          </div>

          {/* Location */}
          <div className="mt-2 flex items-center gap-1">
            <IconMapPin size={13} className="flex-shrink-0 text-charcoal-700/50" />
            <AppText variant="caption" as="span" className="truncate normal-case tracking-normal text-charcoal-700/70">
              {hospital.location}
            </AppText>
          </div>

          {/* Enabled modules */}
          <Show when={enabledModules.length > 0}>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Repeat each={enabledModules}>
                {(mod: string) => (
                  <span
                    key={mod}
                    className="inline-flex items-center rounded-full border border-forest-900/10 bg-cream-50 px-2 py-0.5 text-xs font-medium text-charcoal-700"
                  >
                    {MODULE_LABELS[mod] ?? mod}
                  </span>
                )}
              </Repeat>
            </div>
          </Show>
        </div>
      </div>
    </Link>
  );
}
