// Theme
export * from './theme/index.js';

// Utils
export { cn } from './utils/cn.js';

// Primitives
export { AppButton } from './primitives/app-button/index.js';
export type { AppButtonVariant, AppButtonProps } from './primitives/app-button/index.js';
export { AppText } from './primitives/app-text/index.js';
export type { AppTextVariant, AppTextProps } from './primitives/app-text/index.js';

// Icons are NOT re-exported here. Import them via the dedicated proxy:
//   import { IconHome } from '@icons';
// This keeps the icon source swappable in one file.

// Drawer system (DrawerService, ModalHost, ToastHost)
export { DrawerService } from './drawer/drawer-service.js';
export { ModalHost } from './drawer/modal-host.js';
export { ToastHost } from './drawer/toast-host.js';
export { drawerStore } from './drawer/drawer-store.js';
export type {
  ToastType,
  ModalKind,
  ModalPosition,
  ToastEntry,
  ModalEntry,
  FeedbackModalEntry,
  ConfirmationModalEntry,
  InputModalEntry,
  CustomModalEntry,
} from './drawer/drawer-store.js';

// Avatar & pills
export * from './avatar-pill/index.js';

// Banner
export * from './banner/index.js';

// Bed board
export * from './bed-board/index.js';

// Button
export * from './button/index.js';

// Card
export * from './card/index.js';

// Charts
export * from './charts/index.js';

// Date & time
export * from './datetime/index.js';

// EMR
export * from './emr/index.js';

// Equipment
export * from './equipment/index.js';

// Feedback
export * from './feedback/index.js';

// Input
export * from './input/index.js';

// Lab
export * from './lab/index.js';

// Modal
export * from './modal/index.js';

// Navigation
export * from './navigation/index.js';

// Registration
export * from './registration/index.js';

// Selection
export * from './selection/index.js';

// Skeleton & progress
export * from './skeleton-progress/index.js';

// Specialized
export * from './specialized/index.js';

// Staff
export * from './staff/index.js';

// Table
export * from './table/index.js';

// Telehealth
export * from './telehealth/index.js';

// Tooltip
export * from './tooltip/index.js';

// Vitals
export * from './vitals/index.js';
