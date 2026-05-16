import { useSyncExternalStore, useState } from 'react';
import { createPortal } from 'react-dom';
import { X as IconClose } from 'lucide-react';
import { drawerStore } from './drawer-store.js';
import type { ModalEntry, FeedbackModalEntry, ConfirmationModalEntry, InputModalEntry, CustomModalEntry, ModalPosition, ModalKind } from './drawer-store.js';

const KIND_ACCENT: Record<ModalKind, { rule: string; confirm: string }> = {
  info: {
    rule: 'bg-[var(--text-primary)]',
    confirm: 'bg-[var(--text-primary)] text-[var(--neutral-0)] hover:opacity-80',
  },
  success: {
    rule: 'bg-[var(--records-700)]',
    confirm: 'bg-[var(--records-700)] text-[var(--neutral-0)] hover:bg-[var(--records-800)]',
  },
  warning: {
    rule: 'bg-[var(--warning-icon)]',
    confirm: 'bg-[var(--warning-icon)] text-[var(--neutral-0)] hover:opacity-80',
  },
  error: {
    rule: 'bg-[var(--danger-icon)]',
    confirm: 'bg-[var(--danger-icon)] text-[var(--neutral-0)] hover:opacity-80',
  },
};

function positionClasses(position: ModalPosition): string {
  switch (position) {
    case 'top': return 'items-start pt-[48px]';
    case 'bottom': return 'items-end pb-[48px]';
    case 'fullscreen': return 'items-stretch';
    default: return 'items-center';
  }
}

function dialogClasses(position: ModalPosition): string {
  switch (position) {
    case 'fullscreen': return 'w-full h-full overflow-auto';
    case 'top':
    case 'bottom': return 'w-full max-w-[640px] mx-4';
    default: return 'w-[520px] max-w-[calc(100vw-32px)]';
  }
}

function FeedbackModal({ entry }: { readonly entry: FeedbackModalEntry }) {
  const acct = KIND_ACCENT[entry.modalKind];
  function dismiss() { drawerStore.dismissModal(entry.id); }
  function confirm() { entry.onConfirm?.(); dismiss(); }

  return (
    <div className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_24px_48px_rgba(24,22,19,0.24)] overflow-hidden">
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${acct.rule}`} />
      <div className="flex items-baseline gap-3 px-[22px] py-4 border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h2 className="m-0 font-serif text-[19px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{entry.title}</h2>
        {entry.showCloseButton && (
          <button type="button" onClick={dismiss} className="ml-auto bg-transparent border-0 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0">
            <IconClose size={16} />
          </button>
        )}
      </div>
      <div className="px-[26px] py-[22px] text-[14px] leading-[1.55] text-[var(--text-secondary)] font-serif">
        {entry.body}
      </div>
      <div className="flex items-center justify-end gap-2 px-[22px] py-3.5 border-t border-[var(--border-default)] bg-[var(--surface-sunken)]">
        <button type="button" onClick={confirm} className={`h-8 px-4 font-ui text-[13px] font-medium border-0 cursor-pointer transition-colors rounded-[4px] ${acct.confirm}`}>
          {entry.confirmButtonText}
        </button>
      </div>
    </div>
  );
}

function ConfirmationModal({ entry }: { readonly entry: ConfirmationModalEntry }) {
  const acct = KIND_ACCENT[entry.modalKind];
  const isDestructive = entry.destructive;
  function dismiss() { entry.onCancel?.(); drawerStore.dismissModal(entry.id); }
  function confirm() { entry.onConfirm?.(); drawerStore.dismissModal(entry.id); }

  return (
    <div className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_24px_48px_rgba(24,22,19,0.24)] overflow-hidden">
      {isDestructive
        ? <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--danger-icon)]" />
        : <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${acct.rule}`} />}
      <div className="flex items-baseline gap-3 px-[22px] py-4 border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h2 className="m-0 font-serif text-[19px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{entry.title}</h2>
        <button type="button" onClick={dismiss} className="ml-auto bg-transparent border-0 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0">
          <IconClose size={16} />
        </button>
      </div>
      <div className="px-[26px] py-[22px] text-[14px] leading-[1.55] text-[var(--text-secondary)] font-serif">
        {entry.body}
      </div>
      <div className="flex items-center gap-2 px-[22px] py-3.5 border-t border-[var(--border-default)] bg-[var(--surface-sunken)]">
        <button type="button" onClick={dismiss} className="h-8 px-3.5 font-ui text-[13px] font-medium border border-[var(--border-default)] text-[var(--text-tertiary)] cursor-pointer bg-transparent hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors rounded-[4px]">
          {entry.cancelButtonText}
        </button>
        <span className="flex-1" />
        <button type="button" onClick={confirm} className={`h-8 px-4 font-ui text-[13px] font-medium border-0 cursor-pointer transition-colors rounded-[4px] ${isDestructive ? 'bg-[var(--danger-icon)] text-[var(--neutral-0)] hover:opacity-80' : acct.confirm}`}>
          {entry.confirmButtonText}
        </button>
      </div>
    </div>
  );
}

function InputModal({ entry }: { readonly entry: InputModalEntry }) {
  const [value, setValue] = useState('');
  function dismiss() { entry.onCancel?.(); drawerStore.dismissModal(entry.id); }
  function confirm() { entry.onConfirm?.(value); drawerStore.dismissModal(entry.id); }

  return (
    <div className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_24px_48px_rgba(24,22,19,0.24)] overflow-hidden">
      <div className="flex items-baseline gap-3 px-[22px] py-4 border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h2 className="m-0 font-serif text-[19px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{entry.title}</h2>
        {entry.stepLabel != null && (
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">{entry.stepLabel}</span>
        )}
        <button type="button" onClick={dismiss} className="ml-auto bg-transparent border-0 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0">
          <IconClose size={16} />
        </button>
      </div>
      <div className="px-[26px] py-[22px] flex flex-col gap-3">
        {entry.body !== '' && (
          <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)] font-serif">{entry.body}</p>
        )}
        {entry.multiline ? (
          <textarea
            className="bg-[var(--surface-sunken)] border border-[var(--border-default)] px-3 py-2.5 font-serif text-[14px] text-[var(--text-primary)] leading-[1.5] outline-none resize-y min-h-[80px] w-full focus:border-[var(--text-primary)] transition-colors"
            placeholder={entry.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        ) : (
          <input
            type={entry.inputType}
            className="bg-transparent border-0 border-b border-[var(--text-primary)] pb-2 font-serif text-[16px] text-[var(--text-primary)] outline-none w-full focus:border-[var(--brand-500)] transition-colors"
            placeholder={entry.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirm(); }}
            autoFocus
          />
        )}
      </div>
      <div className="flex items-center gap-2 px-[22px] py-3.5 border-t border-[var(--border-default)] bg-[var(--surface-sunken)]">
        <button type="button" onClick={dismiss} className="h-8 px-3.5 font-ui text-[13px] font-medium border border-[var(--border-default)] text-[var(--text-tertiary)] cursor-pointer bg-transparent hover:text-[var(--text-primary)] transition-colors rounded-[4px]">
          Cancel
        </button>
        <span className="flex-1" />
        <button type="button" onClick={confirm} className="h-8 px-4 font-ui text-[13px] font-medium bg-[var(--text-primary)] text-[var(--neutral-0)] border-0 cursor-pointer hover:opacity-80 transition-opacity rounded-[4px]">
          {entry.confirmButtonText}
        </button>
      </div>
    </div>
  );
}

function CustomModal({ entry }: { readonly entry: CustomModalEntry }) {
  function dismiss() { entry.onClose?.(); drawerStore.dismissModal(entry.id); }

  return (
    <div className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_24px_48px_rgba(24,22,19,0.24)] overflow-hidden">
      <div className="flex items-baseline gap-3 px-[22px] py-4 border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h2 className="m-0 font-serif text-[19px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{entry.title}</h2>
        <button type="button" onClick={dismiss} className="ml-auto bg-transparent border-0 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0">
          <IconClose size={16} />
        </button>
      </div>
      <div className="px-[26px] py-[22px]">
        {entry.contentFn()}
      </div>
    </div>
  );
}

function ModalShell({ entry }: { readonly entry: ModalEntry }) {
  const flex = positionClasses(entry.position);
  const dlg = dialogClasses(entry.position);

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    drawerStore.dismissModal(entry.id);
  }

  return (
    <div className={`fixed inset-0 z-[9000] flex justify-center bg-black/20 ${flex}`} onClick={handleBackdrop}>
      <div className={dlg}>
        {entry.kind === 'feedback' && <FeedbackModal entry={entry} />}
        {entry.kind === 'confirmation' && <ConfirmationModal entry={entry} />}
        {entry.kind === 'input' && <InputModal entry={entry} />}
        {entry.kind === 'custom' && <CustomModal entry={entry} />}
      </div>
    </div>
  );
}

export function ModalHost() {
  const modals = useSyncExternalStore(
    (cb) => drawerStore.subscribe(cb),
    () => drawerStore.getState().modals,
  );

  if (modals.length === 0) return null;

  return createPortal(
    <>
      {modals.map((entry) => (
        <ModalShell key={entry.id} entry={entry} />
      ))}
    </>,
    document.body,
  );
}
