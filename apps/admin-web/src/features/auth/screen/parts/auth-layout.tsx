import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppText } from '@medcord/ui';
import { ADMIN_ROUTES } from '@shared/constants/routes.ts';

interface AuthLayoutProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-cream-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to={ADMIN_ROUTES.LOGIN} className="inline-block">
            <span className="text-xl font-semibold text-forest-900">Medcord</span>
            <span className="ml-1.5 rounded bg-forest-900/10 px-1.5 py-0.5 text-xs font-medium text-forest-900">
              Admin
            </span>
          </Link>
          <AppText variant="heading-2" className="mt-4 text-charcoal-900">
            {title}
          </AppText>
          <Show when={subtitle !== undefined}>
            <AppText variant="body-sm" className="mt-1 text-charcoal-700">
              {subtitle}
            </AppText>
          </Show>
        </div>

        <div className="rounded-xl border border-forest-900/10 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
