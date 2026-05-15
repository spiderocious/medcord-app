import type { ReactNode } from 'react';

/* ============================================================
   DrawerStore — imperative state backing DrawerService.
   Pure pub-sub singleton; no framework dependency.
   ============================================================ */

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ModalKind = 'success' | 'error' | 'warning' | 'info';
export type ModalPosition = 'center' | 'top' | 'bottom' | 'fullscreen';

export interface ToastEntry {
  readonly id: string;
  readonly message: string;
  readonly type: ToastType;
  readonly position: 'bottom' | 'top';
  readonly sticky: boolean;
}

export interface FeedbackModalEntry {
  readonly kind: 'feedback';
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly modalKind: ModalKind;
  readonly position: ModalPosition;
  readonly showCloseButton: boolean;
  readonly confirmButtonText: string;
  readonly onConfirm?: () => void;
}

export interface ConfirmationModalEntry {
  readonly kind: 'confirmation';
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly modalKind: ModalKind;
  readonly destructive: boolean;
  readonly position: ModalPosition;
  readonly confirmButtonText: string;
  readonly cancelButtonText: string;
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
}

export interface InputModalEntry {
  readonly kind: 'input';
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly placeholder: string;
  readonly confirmButtonText: string;
  readonly position: ModalPosition;
  readonly inputType: 'text' | 'email' | 'password';
  readonly multiline: boolean;
  readonly stepLabel?: string;
  readonly onConfirm?: (value: string) => void;
  readonly onCancel?: () => void;
}

export interface CustomModalEntry {
  readonly kind: 'custom';
  readonly id: string;
  readonly title: string;
  readonly position: ModalPosition;
  readonly contentFn: () => ReactNode;
  readonly onClose?: () => void;
}

export type ModalEntry = FeedbackModalEntry | ConfirmationModalEntry | InputModalEntry | CustomModalEntry;

export interface DrawerState {
  readonly toasts: ReadonlyArray<ToastEntry>;
  readonly modals: ReadonlyArray<ModalEntry>;
}

type Listener = () => void;

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

class DrawerStoreClass {
  private state: DrawerState = { toasts: [], modals: [] };
  private listeners = new Set<Listener>();

  getState(): DrawerState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  private setState(patch: Partial<DrawerState>) {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  toast(message: string, opts?: {
    type?: ToastType;
    position?: 'bottom' | 'top';
    sticky?: boolean;
    autoDismissMs?: number;
  }): string {
    const id = uid();
    const entry: ToastEntry = {
      id,
      message,
      type: opts?.type ?? 'info',
      position: opts?.position ?? 'bottom',
      sticky: opts?.sticky ?? false,
    };
    this.setState({ toasts: [...this.state.toasts, entry] });
    const delay = opts?.autoDismissMs ?? (opts?.sticky === true ? 0 : 4000);
    if (delay > 0) {
      setTimeout(() => this.dismissToast(id), delay);
    }
    return id;
  }

  dismissToast(id: string) {
    this.setState({ toasts: this.state.toasts.filter((t) => t.id !== id) });
  }

  showFeedbackModal(title: string, body: string, opts?: {
    kind?: ModalKind;
    position?: ModalPosition;
    showCloseButton?: boolean;
    confirmButtonText?: string;
    onConfirm?: () => void;
  }): string {
    const id = uid();
    const entry: FeedbackModalEntry = {
      kind: 'feedback',
      id,
      title,
      body,
      modalKind: opts?.kind ?? 'info',
      position: opts?.position ?? 'center',
      showCloseButton: opts?.showCloseButton ?? true,
      confirmButtonText: opts?.confirmButtonText ?? 'OK',
      onConfirm: opts?.onConfirm,
    };
    this.setState({ modals: [...this.state.modals, entry] });
    return id;
  }

  showConfirmationModal(title: string, body: string, opts?: {
    kind?: ModalKind;
    destructive?: boolean;
    position?: ModalPosition;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }): string {
    const id = uid();
    const entry: ConfirmationModalEntry = {
      kind: 'confirmation',
      id,
      title,
      body,
      modalKind: opts?.kind ?? 'info',
      destructive: opts?.destructive ?? false,
      position: opts?.position ?? 'center',
      confirmButtonText: opts?.confirmButtonText ?? 'Confirm',
      cancelButtonText: opts?.cancelButtonText ?? 'Cancel',
      onConfirm: opts?.onConfirm,
      onCancel: opts?.onCancel,
    };
    this.setState({ modals: [...this.state.modals, entry] });
    return id;
  }

  showInputModal(title: string, body: string, opts?: {
    placeholder?: string;
    confirmButtonText?: string;
    position?: ModalPosition;
    inputType?: 'text' | 'email' | 'password';
    multiline?: boolean;
    stepLabel?: string;
    onConfirm?: (value: string) => void;
    onCancel?: () => void;
  }): string {
    const id = uid();
    const entry: InputModalEntry = {
      kind: 'input',
      id,
      title,
      body,
      placeholder: opts?.placeholder ?? '',
      confirmButtonText: opts?.confirmButtonText ?? 'Submit',
      position: opts?.position ?? 'center',
      inputType: opts?.inputType ?? 'text',
      multiline: opts?.multiline ?? false,
      stepLabel: opts?.stepLabel,
      onConfirm: opts?.onConfirm,
      onCancel: opts?.onCancel,
    };
    this.setState({ modals: [...this.state.modals, entry] });
    return id;
  }

  showCustomModal(title: string, contentFn: () => ReactNode, opts?: {
    position?: ModalPosition;
    onClose?: () => void;
  }): string {
    const id = uid();
    const entry: CustomModalEntry = {
      kind: 'custom',
      id,
      title,
      contentFn,
      position: opts?.position ?? 'center',
      onClose: opts?.onClose,
    };
    this.setState({ modals: [...this.state.modals, entry] });
    return id;
  }

  dismissModal(id: string) {
    this.setState({ modals: this.state.modals.filter((m) => m.id !== id) });
  }

  dismissAll() {
    this.setState({ toasts: [], modals: [] });
  }

  dismissAllModals() {
    this.setState({ modals: [] });
  }

  dismissAllToasts() {
    this.setState({ toasts: [] });
  }
}

export const drawerStore = new DrawerStoreClass();
