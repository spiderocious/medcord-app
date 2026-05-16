import { type ComponentType } from 'react';
import { Show } from 'meemaw';

import { AppText } from '@medcord/ui';

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly Icon: ComponentType<{ size: number; className?: string }>;
  readonly loading?: boolean;
}

export function StatCard({ label, value, Icon, loading = false }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-forest-900/10 bg-cream-50">
        <Icon size={18} className="text-forest-900/70" />
      </div>
      <div>
        <Show
          when={loading}
          fallback={
            <AppText variant="heading-1" className="text-charcoal-900">
              {value}
            </AppText>
          }
        >
          <div className="mb-1 h-7 w-16 animate-pulse rounded-md bg-forest-900/5" />
        </Show>
        <AppText variant="caption" className="mt-0.5 normal-case tracking-normal text-charcoal-700">
          {label}
        </AppText>
      </div>
    </div>
  );
}
