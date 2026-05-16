import { Link, useLocation } from 'react-router-dom';
import { Repeat } from 'meemaw';
import { ROUTES } from '@shared/constants/routes.ts';
import type { ReactNode } from 'react';

interface ChartLayoutProps {
  readonly slug: string;
  readonly patientCode: string;
  readonly children: ReactNode;
  readonly patientName?: string;
}

interface TabDef {
  readonly label: string;
  readonly path: (s: string, c: string) => string;
}

const TABS: TabDef[] = [
  { label: 'Overview', path: (s, c) => ROUTES.HOSPITAL_CHART(s, c) },
  { label: 'Vitals', path: (s, c) => ROUTES.HOSPITAL_CHART_VITALS(s, c) },
  { label: 'Medications', path: (s, c) => ROUTES.HOSPITAL_CHART_MEDICATIONS(s, c) },
  { label: 'History', path: (s, c) => ROUTES.HOSPITAL_CHART_HISTORY(s, c) },
  { label: 'Procedures', path: (s, c) => ROUTES.HOSPITAL_CHART_PROCEDURES(s, c) },
  { label: 'Immunizations', path: (s, c) => ROUTES.HOSPITAL_CHART_IMMUNIZATIONS(s, c) },
  { label: 'Documents', path: (s, c) => ROUTES.HOSPITAL_CHART_DOCUMENTS(s, c) },
  { label: 'Audit', path: (s, c) => ROUTES.HOSPITAL_CHART_AUDIT(s, c) },
];

export function ChartLayout({ slug, patientCode, children, patientName }: ChartLayoutProps) {
  const { pathname } = useLocation();

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-charcoal-700/60">
          <Link to={ROUTES.HOSPITAL_PATIENTS(slug)} className="hover:text-charcoal-900 transition-colors">Patients</Link>
          <span>/</span>
          <Link to={ROUTES.HOSPITAL_PATIENT_PROFILE(slug, patientCode)} className="hover:text-charcoal-900 transition-colors">
            {patientName ?? patientCode}
          </Link>
          <span>/</span>
          <span className="text-charcoal-900">Chart</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <nav className="flex gap-1 border-b border-forest-900/10">
          <Repeat each={TABS}>
            {(tab: TabDef) => {
              const href = tab.path(slug, patientCode);
              const isActive = pathname === href;
              return (
                <Link
                  key={tab.label}
                  to={href}
                  className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    isActive
                      ? 'border-forest-900 text-forest-900'
                      : 'border-transparent text-charcoal-700/60 hover:text-charcoal-900'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            }}
          </Repeat>
        </nav>
      </div>

      <div>{children}</div>
    </div>
  );
}
