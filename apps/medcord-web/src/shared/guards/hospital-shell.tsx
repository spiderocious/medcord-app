import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loadable } from 'meemaw';

import { ROUTES } from '@shared/constants/routes.ts';
import { AppShell } from '@shared/widgets/app-shell/app-shell.tsx';
import { useHospitalBySlug } from '@shared/api/use-hospital-by-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';

export function HospitalShell() {
  const { slug } = useParams<{ slug: string }>();

  if (slug === undefined || slug === '') {
    return <Navigate to={ROUTES.HOSPITALS} replace />;
  }

  return <HospitalShellContent slug={slug} />;
}

interface HospitalShellContentProps {
  readonly slug: string;
}

function HospitalShellContent({ slug }: HospitalShellContentProps) {
  const { data: hospital, isLoading, error } = useHospitalBySlug(slug);
  const { setActiveHospitalId } = useAuth();

  useEffect(() => {
    if (hospital !== undefined) {
      setActiveHospitalId(hospital.id);
    }
  }, [hospital, setActiveHospitalId]);

  return (
    <Loadable
      loading={isLoading}
      error={error ?? undefined}
      loadingComponent={
        <div className="flex h-screen items-center justify-center bg-cream-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
        </div>
      }
      errorComponent={
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-cream-50 px-4">
          <p className="text-sm text-charcoal-700">Could not load hospital workspace.</p>
          <a href={ROUTES.HOSPITALS} className="text-sm font-medium text-forest-900 hover:underline">
            Back to workspaces
          </a>
        </div>
      }
    >
      <AppShell hospital={hospital!} />
    </Loadable>
  );
}
