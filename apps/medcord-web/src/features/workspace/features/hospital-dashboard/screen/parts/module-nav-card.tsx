import { type ComponentType } from 'react';
import { Link } from 'react-router-dom';

import { AppText } from '@medcord/ui';
import { IconChevronRight } from '@icons';

interface ModuleNavCardProps {
  readonly label: string;
  readonly description: string;
  readonly Icon: ComponentType<{ size: number; className?: string }>;
  readonly to: string;
  readonly badge?: string;
}

export function ModuleNavCard({ label, description, Icon, to, badge }: ModuleNavCardProps) {
  return (
    <Link to={to} className="group block">
      <div className="flex items-center gap-4 rounded-xl border border-forest-900/10 bg-white p-4 shadow-sm transition-all hover:-translate-y-px hover:border-forest-900/20 hover:shadow-md sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-forest-900/10 bg-cream-50 sm:h-11 sm:w-11">
          <Icon size={20} className="text-forest-900/70" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <AppText variant="body-sm" as="span" className="font-semibold text-charcoal-900">
              {label}
            </AppText>
            {badge !== undefined && (
              <span className="rounded-full border border-forest-900/10 bg-cream-50 px-2 py-0.5 text-xs font-medium text-charcoal-700">
                {badge}
              </span>
            )}
          </div>
          <AppText variant="caption" as="p" className="mt-0.5 normal-case tracking-normal text-charcoal-700">
            {description}
          </AppText>
        </div>
        <IconChevronRight
          size={16}
          className="shrink-0 text-charcoal-700/30 transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}
