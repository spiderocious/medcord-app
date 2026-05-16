import { drawerStore } from './drawer-store.js';

export const DrawerService = {
  toast: drawerStore.toast.bind(drawerStore),
  showFeedbackModal: drawerStore.showFeedbackModal.bind(drawerStore),
  showConfirmationModal: drawerStore.showConfirmationModal.bind(drawerStore),
  showInputModal: drawerStore.showInputModal.bind(drawerStore),
  showCustomModal: drawerStore.showCustomModal.bind(drawerStore),
  dismissAll: drawerStore.dismissAll.bind(drawerStore),
  dismissAllModals: drawerStore.dismissAllModals.bind(drawerStore),
  dismissAllToasts: drawerStore.dismissAllToasts.bind(drawerStore),
};
