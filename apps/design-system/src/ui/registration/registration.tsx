import { useState } from 'react';
import type { ReactNode, ChangeEvent } from 'react';

/* ============================================================
   Registration — stepper, form fields, insurance, consents
   ============================================================ */

/* ---------------------------------------------------------- */
/* RegistrationStep                                            */
/* ---------------------------------------------------------- */

export type StepStatus = 'done' | 'cur' | 'todo';

export interface RegistrationStepProps {
  readonly ordinal: string;
  readonly name: string;
  readonly meta: string;
  readonly status: StepStatus;
}

export function RegistrationStep({ ordinal, name, meta, status }: RegistrationStepProps) {
  return (
    <div
      className="px-[18px] py-[14px] relative border-r border-[var(--border-default)] last:border-r-0"
      style={{
        background: status === 'cur' ? 'var(--surface-base)' : 'var(--surface-raised)',
        boxShadow: status === 'cur' ? 'inset 0 -3px 0 var(--text-primary)' : undefined,
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{
          color: status === 'done' ? 'var(--records-800)' : status === 'cur' ? 'var(--text-primary)' : 'var(--text-tertiary)',
        }}
      >
        {ordinal}
      </div>
      <div
        className="font-serif text-[17px] font-medium tracking-[-0.005em] mt-1"
        style={{ color: status === 'todo' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
      >
        {name}
      </div>
      <div
        className="font-mono text-[10px] tracking-[0] mt-1"
        style={{ color: status === 'done' ? 'var(--records-700)' : 'var(--text-tertiary)' }}
      >
        {meta}
      </div>
      {status === 'done' && (
        <span
          className="absolute top-3 right-[18px] font-serif text-[22px]"
          style={{ color: 'var(--records-700)' }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* RegistrationStepper                                         */
/* ---------------------------------------------------------- */

export interface StepperStep {
  readonly ordinal: string;
  readonly name: string;
  readonly meta: string;
  readonly status: StepStatus;
}

export interface RegistrationStepperProps {
  readonly steps: readonly [StepperStep, StepperStep, StepperStep, StepperStep, StepperStep];
}

export function RegistrationStepper({ steps }: RegistrationStepperProps) {
  return (
    <div
      className="border border-[var(--text-primary)] mb-7"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--surface-raised)' }}
    >
      {steps.map((step, i) => (
        <RegistrationStep key={i} {...step} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* FormField                                                   */
/* ---------------------------------------------------------- */

export interface FormFieldProps {
  readonly label: string;
  readonly value?: string;
  readonly type?: 'text' | 'select';
  readonly options?: readonly string[];
  readonly mono?: boolean;
  readonly helpText?: string;
  readonly computedNote?: ReactNode;
  readonly full?: boolean;
  readonly onChange?: (value: string) => void;
}

export function FormField({ label, value, type = 'text', options, mono, helpText, computedNote, onChange }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setLocalValue(e.target.value);
    onChange?.(e.target.value);
  }

  const borderColor = focused ? 'var(--text-primary)' : 'var(--text-tertiary)';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">{label}</div>
      {type === 'select' && options != null ? (
        <select
          value={localValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="bg-transparent border-0 outline-none text-[var(--text-primary)] font-sans text-[16px]"
          style={{ borderBottom: `1px solid ${borderColor}`, padding: '4px 0 6px' }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`bg-transparent border-0 outline-none text-[var(--text-primary)] text-[16px] ${mono ? 'font-mono' : 'font-sans'}`}
          style={{ borderBottom: `1px solid ${borderColor}`, padding: '4px 0 6px' }}
        />
      )}
      {helpText != null && (
        <div className="font-serif italic text-[12px] text-[var(--text-tertiary)] leading-[1.4]">{helpText}</div>
      )}
      {computedNote != null && (
        <div className="font-serif italic text-[14px] text-[var(--text-tertiary)]">{computedNote}</div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* ConsentRow                                                  */
/* ---------------------------------------------------------- */

export type ConsentVariant = 'signed' | 'required' | 'optional';

export interface ConsentRowProps {
  readonly name: string;
  readonly meta: string;
  readonly variant: ConsentVariant;
  readonly checked?: boolean;
  readonly actionLabel: string;
  readonly onAction?: () => void;
  readonly onToggle?: () => void;
}

export function ConsentRow({ name, meta, variant, checked = false, actionLabel, onAction, onToggle }: ConsentRowProps) {
  return (
    <div
      className="px-[18px] py-[14px] border"
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr auto',
        gap: 14,
        alignItems: 'center',
        background:
          variant === 'signed'
            ? 'var(--records-50)'
            : variant === 'required'
            ? 'var(--warning-surface)'
            : 'var(--surface-raised)',
        borderColor:
          variant === 'signed'
            ? 'var(--records-700)'
            : variant === 'required'
            ? 'var(--warning-icon)'
            : 'var(--border-default)',
        borderStyle: variant === 'required' ? 'dashed' : 'solid',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="w-[18px] h-[18px] rounded-[2px] inline-flex items-center justify-center flex-shrink-0 cursor-pointer border-0 p-0"
        style={{
          background: checked ? 'var(--text-primary)' : 'transparent',
          border: checked ? '1.5px solid var(--text-primary)' : '1.5px solid var(--text-secondary)',
        }}
        aria-checked={checked}
        role="checkbox"
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="var(--neutral-0)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Name + meta */}
      <div>
        <div
          className="font-serif text-[16px] font-medium tracking-[-0.005em]"
          style={{ color: variant === 'required' ? 'var(--warning-icon)' : 'var(--text-primary)' }}
        >
          {name}
        </div>
        <div
          className="font-mono text-[11px] tracking-[0] mt-[2px]"
          style={{ color: variant === 'required' ? 'var(--warning-icon)' : 'var(--text-tertiary)' }}
        >
          {meta}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onAction}
        className="font-sans text-[12px] font-medium h-[30px] px-[14px] rounded border cursor-pointer"
        style={
          variant === 'required'
            ? { background: 'var(--warning-icon)', color: '#fff', borderColor: 'var(--warning-icon)' }
            : variant === 'signed'
            ? { background: 'transparent', color: 'var(--text-tertiary)', borderColor: 'var(--border-default)' }
            : { background: 'transparent', color: 'var(--text-tertiary)', borderColor: 'var(--border-default)' }
        }
      >
        {actionLabel}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* InsuranceCard                                               */
/* ---------------------------------------------------------- */

export interface InsuranceFace {
  readonly variant: 'dark' | 'light';
  readonly topLabel: string;
  readonly name: string;
  readonly id: string;
  readonly bottomLine?: string;
  readonly body?: ReactNode;
}

export interface InsuranceCardProps {
  readonly title: string;
  readonly meta?: string;
  readonly frontFace: InsuranceFace;
  readonly backFace: InsuranceFace;
}

export function InsuranceCard({ title, meta, frontFace, backFace }: InsuranceCardProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)]">
      <div
        className="px-4 py-3 border-b border-[var(--text-primary)] bg-[var(--surface-sunken)] flex items-baseline gap-2"
      >
        <span className="font-serif text-[16px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">{title}</span>
        {meta != null && (
          <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">{meta}</span>
        )}
      </div>
      <div
        className="p-4"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--text-primary)' }}
      >
        {[frontFace, backFace].map((face, i) => (
          <div
            key={i}
            className="p-3 flex flex-col gap-1"
            style={{
              aspectRatio: '1.6',
              background:
                face.variant === 'dark'
                  ? 'linear-gradient(135deg,#1F2D4A,#395282)'
                  : 'var(--surface-raised)',
            }}
          >
            <span
              className="font-mono text-[9px] uppercase tracking-[0.16em]"
              style={{ color: face.variant === 'dark' ? 'rgba(244,239,230,0.55)' : 'var(--text-tertiary)' }}
            >
              {face.topLabel}
            </span>
            <div
              className="font-serif text-[16px] font-medium"
              style={{ color: face.variant === 'dark' ? '#F4EFE6' : 'var(--text-primary)' }}
            >
              {face.name}
            </div>
            <div
              className="font-mono text-[11px] tracking-[0]"
              style={{ color: face.variant === 'dark' ? '#F4EFE6' : 'var(--text-secondary)' }}
            >
              {face.id}
            </div>
            {face.body}
            {face.bottomLine != null && (
              <div
                className="font-mono text-[11px] tracking-[0] mt-auto"
                style={{ color: face.variant === 'dark' ? '#F4EFE6' : 'var(--text-secondary)' }}
              >
                {face.bottomLine}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* EligibilityBox                                              */
/* ---------------------------------------------------------- */

export interface EligibilityBoxProps {
  readonly status: string;
  readonly detail: string;
  readonly estimateLabel: string;
  readonly estimateValue: string;
  readonly estimateNote: string;
}

export function EligibilityBox({ status, detail, estimateLabel, estimateValue, estimateNote }: EligibilityBoxProps) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: 14 }}>
      <div
        className="px-[18px] py-[14px]"
        style={{
          background: 'var(--records-50)',
          border: '1px solid var(--records-700)',
        }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--records-800)] mb-1">
          Eligibility
        </div>
        <div className="font-serif text-[16px] font-medium text-[var(--records-800)]">{status}</div>
        <div className="font-mono text-[11px] text-[var(--records-800)] tracking-[0] mt-1">{detail}</div>
      </div>
      <div
        className="px-[18px] py-[14px]"
        style={{ border: '1px solid var(--border-default)' }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-1">
          {estimateLabel}
        </div>
        <div className="font-serif text-[18px] font-medium text-[var(--text-primary)]">{estimateValue}</div>
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] mt-1">{estimateNote}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* RegistrationSheet                                           */
/* ---------------------------------------------------------- */

export interface RegistrationSheetProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
}

export function RegistrationSheet({ title, subtitle, children }: RegistrationSheetProps) {
  return (
    <div>
      <div
        className="px-6 py-[18px] border border-[var(--text-primary)] border-b-0"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <h2 className="m-0 font-serif text-[22px] font-medium tracking-[-0.018em] text-[var(--text-primary)]">
          {title}
        </h2>
        {subtitle != null && (
          <p className="font-serif italic text-[14px] text-[var(--text-tertiary)] mt-1.5 leading-[1.5] max-w-[56ch] m-0 mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="border border-[var(--text-primary)] border-t-0 px-8 py-7"
        style={{ background: 'var(--surface-raised)' }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* RegistrationFooter                                          */
/* ---------------------------------------------------------- */

export interface RegistrationFooterProps {
  readonly whyText: string;
  readonly backLabel?: string;
  readonly continueLabel?: string;
  readonly continueDisabled?: boolean;
  readonly onBack?: () => void;
  readonly onContinue?: () => void;
}

export function RegistrationFooter({
  whyText,
  backLabel = '‹ Back',
  continueLabel = 'Continue →',
  continueDisabled = false,
  onBack,
  onContinue,
}: RegistrationFooterProps) {
  return (
    <div
      className="flex items-center gap-3 px-6 py-[14px] border border-[var(--text-primary)] border-t-0"
      style={{ background: 'var(--surface-sunken)' }}
    >
      <div className="font-serif italic text-[13px] text-[var(--text-tertiary)] mr-auto leading-[1.5] max-w-[50ch]">
        <em>{whyText}</em>
      </div>
      <button
        onClick={onBack}
        className="font-sans text-[13px] font-medium h-8 px-[14px] rounded border-0 bg-transparent cursor-pointer text-[var(--text-tertiary)]"
      >
        Save draft
      </button>
      <button
        onClick={onBack}
        className="font-sans text-[13px] font-medium h-8 px-[14px] rounded border border-[var(--text-primary)] bg-transparent cursor-pointer text-[var(--text-primary)]"
      >
        {backLabel}
      </button>
      <button
        onClick={onContinue}
        disabled={continueDisabled}
        className="font-sans text-[13px] font-medium h-8 px-[14px] rounded border border-transparent cursor-pointer text-white"
        style={{
          background: continueDisabled ? undefined : 'var(--records-700)',
          opacity: continueDisabled ? 0.4 : 1,
          cursor: continueDisabled ? 'not-allowed' : 'pointer',
          backgroundColor: 'var(--records-700)',
        }}
      >
        {continueLabel}
      </button>
    </div>
  );
}
