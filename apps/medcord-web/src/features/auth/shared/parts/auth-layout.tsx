import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppText } from '@medcord/ui';
import { ROUTES } from '@shared/constants/routes.ts';

interface AuthLayoutProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
  readonly footerLink?: {
    readonly label: string;
    readonly to: string;
    readonly text: string;
  };
}

export function AuthLayout({ title, subtitle, children, footerLink }: AuthLayoutProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-cream-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to={ROUTES.LOGIN} className="inline-block">
            <span className="text-xl font-semibold text-forest-900">Medcord</span>
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

        <Show when={footerLink !== undefined}>
          <p className="mt-6 text-center text-sm text-charcoal-700">
            {footerLink!.label}{' '}
            <Link
              to={footerLink!.to}
              className="font-medium text-forest-900 hover:underline"
            >
              {footerLink!.text}
            </Link>
          </p>
        </Show>
      </div>
    </div>
  );
}
