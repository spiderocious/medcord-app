import { ROUTES } from './routes';

export interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly group: NavGroup;
  readonly badge?: string;
}

export type NavGroup = 'Foundation' | 'Primitives' | 'Display' | 'Containers' | 'Navigation & Feedback' | 'Domain';

export const NAV_ITEMS: readonly NavItem[] = [
  // Foundation
  { label: 'Tokens', route: ROUTES.TOKENS, group: 'Foundation' },
  // Primitives
  { label: 'Buttons', route: ROUTES.BUTTONS, group: 'Primitives' },
  { label: 'Inputs', route: ROUTES.INPUTS, group: 'Primitives' },
  { label: 'Selection', route: ROUTES.SELECTION, group: 'Primitives' },
  { label: 'Date & Time', route: ROUTES.DATETIME, group: 'Primitives' },
  { label: 'Specialized', route: ROUTES.SPECIALIZED, group: 'Primitives' },
  // Display
  { label: 'Avatars & Pills', route: ROUTES.AVATARS_PILLS, group: 'Display' },
  { label: 'Skeleton & Progress', route: ROUTES.SKELETON_PROGRESS, group: 'Display' },
  { label: 'Tooltip', route: ROUTES.TOOLTIP, group: 'Display' },
  // Containers
  { label: 'Cards', route: ROUTES.CARDS, group: 'Containers' },
  { label: 'Tables', route: ROUTES.TABLES, group: 'Containers' },
  { label: 'Modals', route: ROUTES.MODALS, group: 'Containers' },
  { label: 'Banners', route: ROUTES.BANNERS, group: 'Containers' },
  // Navigation & Feedback
  { label: 'Navigation', route: ROUTES.NAVIGATION, group: 'Navigation & Feedback' },
  { label: 'Feedback', route: ROUTES.FEEDBACK, group: 'Navigation & Feedback' },
  // Domain
  { label: 'Lab', route: ROUTES.LAB, group: 'Domain' },
  { label: 'Vitals', route: ROUTES.VITALS, group: 'Domain' },
  { label: 'Charts', route: ROUTES.CHARTS, group: 'Domain' },
  { label: 'EMR', route: ROUTES.EMR, group: 'Domain' },
  { label: 'Bed Board', route: ROUTES.BED_BOARD, group: 'Domain' },
  { label: 'Telehealth', route: ROUTES.TELEHEALTH, group: 'Domain' },
  { label: 'Equipment', route: ROUTES.EQUIPMENT, group: 'Domain' },
  { label: 'Staff', route: ROUTES.STAFF, group: 'Domain' },
  { label: 'Registration', route: ROUTES.REGISTRATION, group: 'Domain' },
] as const;

export const NAV_GROUPS: readonly NavGroup[] = [
  'Foundation',
  'Primitives',
  'Display',
  'Containers',
  'Navigation & Feedback',
  'Domain',
] as const;
