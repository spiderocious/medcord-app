import type { ComponentType } from 'react';
import type { HospitalModules } from '@shared/types/hospital.ts';

export interface NavItem {
  readonly label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly icon: ComponentType<any>;
  readonly href: string;
  readonly moduleKey?: keyof HospitalModules;
}

export interface NavGroup {
  readonly label?: string;
  readonly items: NavItem[];
}
