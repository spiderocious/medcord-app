import { type ReactNode, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, ShieldAlert } from '@icons';

/* ============================================================
   Modal — a sheet fastened to the desk with a paper clip.
   Five types: confirm, critical, typed-confirm, two-person,
   session-timeout, break-the-glass.
   ============================================================ */

export type ModalSize = 'sm' | 'md' | 'lg';
export type ModalVariant = 'default' | 'critical';

export interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly size?: ModalSize;
  readonly variant?: ModalVariant;
  readonly title: string;
  readonly meta?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

const SIZE_W: Record<ModalSize, string> = {
  sm: 'w-[380px]',
  md: 'w-[520px]',
  lg: 'w-[720px]',
};

export function Modal({ open, onClose, size = 'md', variant = 'default', title, meta, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/18"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={[
        'relative bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_24px_48px_rgba(24,22,19,0.24)] overflow-hidden',
        SIZE_W[size],
        variant === 'critical' ? 'pl-1.5' : '',
      ].join(' ')}>
        {variant === 'critical' && (
          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--danger-icon)]" />
        )}
        {/* Header */}
        <div className={[
          'flex items-baseline gap-3 px-[22px] py-4 border-b',
          variant === 'critical'
            ? 'bg-[var(--danger-icon)] border-[var(--danger-icon)]'
            : 'bg-[var(--surface-sunken)] border-[var(--text-primary)]',
        ].join(' ')}>
          <h2 className={[
            'm-0 font-serif text-[19px] font-medium tracking-[-0.012em]',
            variant === 'critical' ? 'text-[var(--neutral-0)]' : 'text-[var(--text-primary)]',
          ].join(' ')}>{title}</h2>
          {meta !== null && (
            <span className={[
              'ml-auto font-mono text-[10px] uppercase tracking-[0.18em]',
              variant === 'critical' ? 'text-white/75' : 'text-[var(--text-tertiary)]',
            ].join(' ')}>{meta}</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className={[
              'bg-transparent border-0 cursor-pointer text-[18px] leading-none p-0',
              variant === 'critical' ? 'text-white/85' : 'text-[var(--text-tertiary)]',
            ].join(' ')}
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="px-[26px] py-[22px] text-[14px] leading-[1.55] text-[var(--text-secondary)]">
          {children}
        </div>
        {/* Footer */}
        {footer !== null && (
          <div className="flex items-center gap-2 px-[22px] py-3.5 border-t border-[var(--border-default)] bg-[var(--surface-sunken)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ModalGap() {
  return <span className="flex-1" />;
}

/* ---------------------------------------------------------- */
/* ModalField — underline input/select/textarea               */
/* ---------------------------------------------------------- */

export interface ModalFieldProps {
  readonly label: string;
  readonly children: ReactNode;
}

export function ModalField({ label, children }: ModalFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 mb-3.5">
      <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">{label}</div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* CritCallout                                                 */
/* ---------------------------------------------------------- */

export interface CritCalloutProps {
  readonly title: string;
  readonly description: ReactNode;
}

export function CritCallout({ title, description }: CritCalloutProps) {
  return (
    <div className="bg-[var(--danger-surface)] border border-[var(--danger-border)] px-4 py-3.5 mb-4">
      <div className="font-serif text-[17px] font-medium text-[var(--danger-icon)] tracking-[-0.005em]">{title}</div>
      <div className="font-serif italic text-[14px] text-[var(--danger-icon)] mt-1.5 leading-[1.5]">{description}</div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* AuditNote                                                   */
/* ---------------------------------------------------------- */

export function AuditNote({ children, stamp = 'Audit' }: { readonly children: ReactNode; readonly stamp?: string }) {
  return (
    <div className="mt-3.5 px-3 py-2 bg-[var(--text-primary)] text-[var(--neutral-0)] font-mono text-[11px] tracking-[0] flex items-center gap-2">
      <span className="font-mono text-[9px] font-bold tracking-[0.18em] uppercase bg-[var(--danger-icon)] text-[var(--neutral-0)] px-1.5 py-0.5 rounded-[1px]">
        {stamp}
      </span>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* TypedConfirmModal                                           */
/* ---------------------------------------------------------- */

export interface TypedConfirmModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly confirmWord: string;
  readonly onConfirm: () => void;
  readonly confirmLabel?: string;
}

export function TypedConfirmModal({ open, onClose, title, description, confirmWord, onConfirm, confirmLabel = 'Confirm' }: TypedConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const matches = typed.toUpperCase() === confirmWord.toUpperCase();

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <ModalGap />
          <button type="button" onClick={onClose} className="h-8 px-3.5 rounded-[4px] font-ui text-[13px] font-medium text-[var(--text-tertiary)] cursor-pointer bg-transparent border-0 hover:text-[var(--text-primary)]">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches}
            className={[
              'h-8 px-3.5 rounded-[4px] font-ui text-[13px] font-medium border cursor-pointer transition-colors',
              matches
                ? 'text-[var(--danger-icon)] border-[var(--danger-icon)] hover:bg-[var(--danger-icon)] hover:text-[var(--neutral-0)]'
                : 'text-[var(--text-tertiary)] border-[var(--border-default)] opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {description !== null && (
        <p className="m-0 mb-3.5 text-[13px] text-[var(--text-secondary)] leading-[1.55]">{description}</p>
      )}
      <ModalField label={`Type ${confirmWord} to confirm`}>
        <input
          className="font-mono tracking-[0.05em] text-[18px] text-[var(--text-primary)] bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] pb-1 outline-none uppercase w-full"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmWord}
        />
      </ModalField>
      {typed.length > 0 && !matches && (
        <p className="m-0 font-serif italic text-[13px] text-[var(--warning-icon)]">
          {confirmWord.length - typed.length} character{confirmWord.length - typed.length === 1 ? '' : 's'} missing
        </p>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------- */
/* TwoPersonModal                                              */
/* ---------------------------------------------------------- */

export interface TwoPersonParty {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
  readonly authenticated?: boolean;
  readonly authenticatedAt?: string;
}

export interface TwoPersonModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly medicationText: string;
  readonly primary: TwoPersonParty;
  readonly witness?: TwoPersonParty;
  readonly onConfirm: () => void;
}

export function TwoPersonModal({ open, onClose, title, medicationText, primary, witness, onConfirm }: TwoPersonModalProps) {
  const bothAuthenticated = primary.authenticated === true && witness?.authenticated === true;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      meta="HIGH-RISK"
      title={title}
      footer={
        <>
          <ModalGap />
          <button type="button" onClick={onClose} className="h-8 px-3.5 font-ui text-[13px] font-medium text-[var(--text-tertiary)] cursor-pointer bg-transparent border-0 hover:text-[var(--text-primary)]">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!bothAuthenticated}
            className={[
              'h-8 px-3.5 rounded-[4px] font-ui text-[13px] font-medium cursor-pointer transition-colors border',
              bothAuthenticated
                ? 'bg-[var(--records-700)] text-[var(--neutral-0)] border-[var(--records-700)] hover:bg-[var(--records-800)]'
                : 'text-[var(--text-tertiary)] border-[var(--border-default)] opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            {bothAuthenticated ? 'Begin infusion' : 'Both signatures required'}
          </button>
        </>
      }
    >
      {/* Override body padding via wrapper */}
      <div className="-mx-[26px] -mt-[22px]">
        <div className="px-[22px] py-3.5 bg-[var(--text-primary)] text-[var(--neutral-0)] font-serif italic text-[14px] leading-[1.5]">
          Verify dose, concentration, and patient identity. Both signatures are required before infusion can begin.
        </div>
        <div className="grid border-b border-[var(--text-primary)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Primary */}
          <div className="px-[22px] py-[22px] border-r border-[var(--text-primary)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-3">Primary nurse</div>
            <div className="flex items-center gap-2.5 mb-3.5 pb-3.5 border-b border-dashed border-[var(--border-default)]">
              <span className="w-9 h-9 rounded-[4px] flex items-center justify-center font-ui font-semibold text-[13px]"
                style={{ background: '#DDE3D4', color: '#495939', border: '1px solid #C2CCB4' }}>
                {primary.initials}
              </span>
              <div>
                <div className="font-serif text-[16px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">{primary.name}</div>
                <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">{primary.role}</div>
              </div>
            </div>
            <ModalField label="Badge PIN">
              <input type="password" defaultValue="••••••" className="font-mono text-[18px] tracking-[0.2em] text-[var(--text-primary)] bg-transparent border-0 border-b border-[var(--text-primary)] pb-1.5 outline-none w-full" />
            </ModalField>
            {primary.authenticated === true && (
              <div className="font-mono text-[11px] text-[var(--records-800)] tracking-[0] mt-2.5">
                ✓ authenticated{primary.authenticatedAt !== null ? ` · ${primary.authenticatedAt}` : ''}
              </div>
            )}
          </div>
          {/* Witness */}
          <div className={['px-[22px] py-[22px]', witness === null ? 'bg-[var(--surface-sunken)]' : ''].join(' ')}>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-3">Witness · second RN</div>
            <div className="flex items-center gap-2.5 mb-3.5 pb-3.5 border-b border-dashed border-[var(--border-default)]">
              <span className={[
                'w-9 h-9 rounded-[4px] flex items-center justify-center font-ui font-semibold text-[13px] border',
                witness !== null ? '' : 'border-dashed border-[var(--border-default)] bg-[var(--surface-sunken)] text-[var(--text-tertiary)]',
              ].join(' ')}
                style={witness !== null ? { background: '#DDE3D4', color: '#495939', border: '1px solid #C2CCB4' } : {}}>
                {witness?.initials ?? '?'}
              </span>
              <div>
                <div className={['font-serif text-[16px] font-medium tracking-[-0.005em]', witness !== null ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] italic'].join(' ')}>
                  {witness?.name ?? 'Awaiting witness'}
                </div>
                <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">{witness?.role ?? 'scan badge or type ID'}</div>
              </div>
            </div>
            <ModalField label="Badge ID">
              <input placeholder="scan or type" className="font-ui text-[14px] text-[var(--text-primary)] bg-transparent border-0 border-b border-[var(--border-default)] pb-1.5 outline-none w-full focus:border-[var(--text-primary)]" />
            </ModalField>
            <ModalField label="PIN">
              <input type="password" placeholder="••••••" className="font-mono text-[18px] tracking-[0.2em] text-[var(--text-primary)] bg-transparent border-0 border-b border-[var(--border-default)] pb-1.5 outline-none w-full focus:border-[var(--text-primary)]" />
            </ModalField>
          </div>
        </div>
        <div className="px-[22px] py-3.5 bg-[var(--danger-surface)] border-t border-[var(--danger-border)]">
          <div className="font-serif text-[13px] font-medium text-[var(--danger-icon)] mb-1">Verifying</div>
          <div className="font-mono text-[12px] text-[var(--danger-icon)] tracking-[0]">{medicationText}</div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- */
/* SessionTimeoutModal                                         */
/* ---------------------------------------------------------- */

export interface SessionTimeoutModalProps {
  readonly open: boolean;
  readonly secondsRemaining: number;
  readonly workstation?: string;
  readonly onLockNow: () => void;
  readonly onStaySignedIn: () => void;
}

export function SessionTimeoutModal({ open, secondsRemaining, workstation, onLockNow, onStaySignedIn }: SessionTimeoutModalProps) {
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const isWarn = secondsRemaining < 60;

  return createPortal(
    open ? (
      <div className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/18">
        <div className="w-[380px] bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_24px_48px_rgba(24,22,19,0.24)] overflow-hidden">
          <div className={['flex items-baseline gap-3 px-[22px] py-4 border-b', isWarn ? 'bg-[var(--warning-surface)] border-[var(--warning-border)]' : 'bg-[var(--surface-sunken)] border-[var(--text-primary)]'].join(' ')}>
            <h2 className={['m-0 font-serif text-[19px] font-medium tracking-[-0.012em]', isWarn ? 'text-[var(--warning-icon)]' : 'text-[var(--text-primary)]'].join(' ')}>
              Session locking soon
            </h2>
            <button type="button" onClick={onLockNow} className={['ml-auto bg-transparent border-0 cursor-pointer text-[18px] leading-none', isWarn ? 'text-[var(--warning-icon)]' : 'text-[var(--text-tertiary)]'].join(' ')}>
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col items-center px-[26px] pt-6 pb-4 text-center">
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className={['font-mono font-medium text-[56px] leading-none tracking-[-0.04em] [font-feature-settings:\'tnum\'_1]', isWarn ? 'text-[var(--warning-icon)]' : 'text-[var(--text-primary)]'].join(' ')}>
                {mins}:{String(secs).padStart(2, '0')}
              </span>
              <span className="font-mono text-[12px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] ml-2.5">remaining</span>
            </div>
            <p className="m-0 font-serif italic text-[14px] text-[var(--text-tertiary)] leading-[1.5] mt-2">
              {workstation !== null ? `Workstation ${workstation}` : 'This workstation'} will lock for HIPAA in {secondsRemaining} seconds. Move the mouse or press a key to extend.
            </p>
          </div>
          <div className="flex items-center gap-2 px-[22px] py-3.5 border-t border-[var(--border-default)] bg-[var(--surface-sunken)]">
            <button type="button" onClick={onLockNow} className="h-8 px-3.5 rounded-[4px] font-ui text-[13px] font-medium border border-[var(--text-primary)] text-[var(--text-primary)] cursor-pointer bg-transparent hover:bg-[var(--text-primary)] hover:text-[var(--neutral-0)] transition-colors">
              Lock now
            </button>
            <span className="flex-1" />
            <button type="button" onClick={onStaySignedIn} className="h-8 px-3.5 rounded-[4px] font-ui text-[13px] font-medium bg-[var(--records-700)] text-[var(--neutral-0)] border border-[var(--records-700)] cursor-pointer hover:bg-[var(--records-800)] transition-colors">
              Stay signed in
            </button>
          </div>
        </div>
      </div>
    ) : null,
    document.body,
  );
}

/* ---------------------------------------------------------- */
/* BreakTheGlassModal                                          */
/* ---------------------------------------------------------- */

export interface BreakTheGlassPatient {
  readonly initials: string;
  readonly name: string;
  readonly mrn: string;
  readonly location?: string;
}

export interface BreakTheGlassModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly patient: BreakTheGlassPatient;
  readonly onAcknowledge: (reason: string, justification: string) => void;
}

const BTG_REASONS = [
  '— select —',
  'Emergency treatment',
  'Code response (rapid response / code blue)',
  'Cross-coverage for absent provider',
  'Quality / peer review',
  'Other (specify)',
] as const;

export function BreakTheGlassModal({ open, onClose, patient, onAcknowledge }: BreakTheGlassModalProps) {
  const [reason, setReason] = useState('');
  const [justification, setJustification] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) { setReason(''); setJustification(''); }
  }, [open]);

  const canSubmit = reason !== '' && reason !== '— select —' && justification.trim().length >= 10;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      variant="critical"
      title="Break-the-glass · emergency access"
      meta="requires reason"
      footer={
        <>
          <ModalGap />
          <button type="button" onClick={onClose} className="h-8 px-3.5 rounded-[4px] font-ui text-[13px] font-medium border border-[var(--text-primary)] text-[var(--text-primary)] cursor-pointer bg-transparent hover:bg-[var(--text-primary)] hover:text-[var(--neutral-0)] transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onAcknowledge(reason, justification)}
            disabled={!canSubmit}
            className={[
              'h-8 px-4 rounded-[4px] font-ui text-[13px] font-medium cursor-pointer border-0 relative overflow-hidden transition-colors',
              canSubmit ? 'bg-[var(--text-primary)] text-[var(--neutral-0)]' : 'bg-[var(--text-primary)] text-[var(--neutral-0)] opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            Acknowledge &amp; access chart
            {canSubmit && <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[var(--danger-icon)]" />}
          </button>
        </>
      }
    >
      <CritCallout
        title="No treatment relationship"
        description={<>You are not currently caring for this patient. Accessing this chart will open an audit alert and trigger a HIPAA review by the privacy officer.</>}
      />

      {/* Patient identity row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface-sunken)] border border-[var(--border-default)] mb-4">
        <span className="w-8 h-8 rounded-full flex items-center justify-center font-ui font-semibold text-[12px]"
          style={{ background: '#ECE3D6', color: '#5C4B30', border: '1px solid #D4C4A6' }}>
          {patient.initials}
        </span>
        <div>
          <div className="font-serif text-[15px] font-medium text-[var(--text-primary)]">{patient.name}</div>
          <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">MRN {patient.mrn}{patient.location !== null ? ` · ${patient.location}` : ''}</div>
        </div>
        <span className="ml-auto font-mono text-[10px] text-[var(--danger-icon)] uppercase tracking-[0.18em] border border-[var(--danger-icon)] px-2 py-[3px]">
          Contains PHI
        </span>
      </div>

      <ModalField label="Reason for access · required">
        <select
          className="font-ui text-[14px] text-[var(--text-primary)] bg-transparent border-0 border-b border-[var(--border-default)] pb-1.5 outline-none w-full focus:border-[var(--text-primary)] cursor-pointer"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {BTG_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </ModalField>

      <ModalField label="Clinical justification">
        <textarea
          ref={textareaRef}
          className="bg-[var(--surface-sunken)] border border-[var(--border-default)] px-2.5 py-2 font-serif italic text-[14px] text-[var(--text-primary)] leading-[1.5] outline-none resize-y min-h-[64px] w-full focus:border-[var(--text-primary)]"
          placeholder="Specific reason · what care is being delivered · who requested…"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
        />
      </ModalField>

      <AuditNote stamp="Logged">
        your name · timestamp · workstation · every field viewed
      </AuditNote>
    </Modal>
  );
}

/* suppress unused icon warning */
void Zap; void ShieldAlert;
