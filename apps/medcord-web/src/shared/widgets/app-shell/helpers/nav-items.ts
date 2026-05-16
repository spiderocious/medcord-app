import type { ComponentType } from 'react';
import type { HospitalModule } from '@shared/types';

export interface NavItem {
  readonly label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly icon: ComponentType<any>;
  readonly href: string;
  readonly module?: HospitalModule;
}

export interface NavGroup {
  readonly label?: string;
  readonly items: NavItem[];
}
