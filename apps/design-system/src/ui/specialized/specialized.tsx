import { X, Paperclip } from '@icons';
import { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

/* ============================================================
   DropZone — dashed edge with serif inscription.
   States: idle, hover, ok, error.
   ============================================================ */

export type DropZoneState = 'idle' | 'hover' | 'ok' | 'error';

export interface DropZoneProps {
  readonly state?: DropZoneState;
  readonly onDrop?: (files: FileList) => void;
  readonly accept?: string;
  readonly label?: string;
  readonly sublabel?: string;
  readonly className?: string;
}

const DZ_VARIANTS: Record<
  DropZoneState,
  { border: string; bg: string; titleColor: string; glyph: string }
> = {
  idle: {
    border: 'border-[var(--text-tertiary)]',
    bg: 'bg-[var(--surface-raised)]',
    titleColor: 'text-[var(--text-primary)]',
    glyph: '↑',
  },
  hover: {
    border: 'border-[var(--text-primary)]',
    bg: 'bg-[var(--surface-sunken)]',
    titleColor: 'text-[var(--text-primary)]',
    glyph: '↑',
  },
  ok: {
    border: 'border-[var(--records-700)]',
    bg: 'bg-[var(--records-50)]',
    titleColor: 'text-[var(--records-800)]',
    glyph: '✓',
  },
  error: {
    border: 'border-[var(--danger-icon)]',
    bg: 'bg-[var(--danger-bg)]',
    titleColor: 'text-[var(--danger-icon)]',
    glyph: '×',
  },
};

export function DropZone({
  state = 'idle',
  onDrop,
  accept,
  label,
  sublabel,
  className = '',
}: DropZoneProps) {
  const [dragState, setDragState] = useState<DropZoneState>(state);
  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveState = state !== 'idle' ? state : dragState;
  const v = DZ_VARIANTS[effectiveState];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragState('hover');
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState('idle');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragState('idle');
      if (e.dataTransfer.files.length > 0) {
        onDrop?.(e.dataTransfer.files);
      }
    },
    [onDrop],
  );

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onDrop?.(e.target.files);
    }
  }

  return (
    <div
      className={[
        'border-[1.5px] border-dashed text-center px-7 py-9 cursor-pointer transition-colors duration-[100ms]',
        v.border,
        v.bg,
        className,
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={handleChange}
      />
      <div className="font-serif text-[36px] text-[var(--text-primary)] leading-none">
        {v.glyph}
      </div>
      <div className={`font-serif italic text-[18px] mt-2.5 tracking-[-0.005em] ${v.titleColor}`}>
        {label ??
          (effectiveState === 'ok'
            ? 'Files uploaded.'
            : effectiveState === 'error'
              ? 'Upload failed.'
              : 'Drop a file or click to upload.')}
      </div>
      {sublabel != null && sublabel !== undefined && (
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] mt-1.5 tracking-[0]">
          {sublabel}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FileRow — uploaded file with progress / status.
   ============================================================ */

export type FileRowStatus = 'uploading' | 'ok' | 'error';

export interface FileRowProps {
  readonly name: string;
  readonly size?: string;
  readonly status: FileRowStatus;
  readonly progress?: number;
  readonly statusLabel?: string;
  readonly onRemove?: () => void;
}

export function FileRow({ name, size, status, progress, statusLabel, onRemove }: FileRowProps) {
  const nameColor =
    status === 'ok'
      ? 'text-[var(--records-800)]'
      : status === 'error'
        ? 'text-[var(--danger-icon)]'
        : 'text-[var(--text-primary)]';

  return (
    <div
      className="grid items-center gap-3 py-3 border-b border-dashed border-[var(--border-default)] last:border-b-0"
      style={{ gridTemplateColumns: '18px 1fr auto auto' }}
    >
      <Paperclip size={14} className="text-[var(--text-tertiary)]" />
      <span className={`text-[14px] ${nameColor}`}>{name}</span>
      {status === 'uploading' && progress != null && progress !== undefined ? (
        <div className="w-[120px] h-1 bg-[var(--surface-sunken)]">
          <div
            className="h-full bg-[var(--text-primary)] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : (
        <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
          {statusLabel ?? status}
        </span>
      )}
      <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
        {status === 'uploading' && progress != null && progress !== undefined
          ? `${progress}%${size ? ` · ${size}` : ''}`
          : (size ?? '')}
        {onRemove != null && onRemove !== undefined && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1.5 text-[var(--text-tertiary)] bg-transparent border-0 cursor-pointer p-0"
          >
            <X size={10} />
          </button>
        )}
      </span>
    </div>
  );
}

/* ============================================================
   DicomThumb — radiology thumbnail.
   Greyscale gradient, mono badge, modality, timestamp.
   ============================================================ */

export interface DicomThumbProps {
  readonly modality: string;
  readonly date: string;
  readonly label: string;
  readonly gradient?: string;
  readonly onClick?: () => void;
  readonly className?: string;
}

export function DicomThumb({
  modality,
  date,
  label,
  gradient,
  onClick,
  className = '',
}: DicomThumbProps) {
  const defaultGradient = 'linear-gradient(135deg, #2A2520, #6E665B 60%, #A39A8A)';
  return (
    <div
      className={`relative aspect-square border border-[var(--text-primary)] cursor-pointer ${className}`}
      style={{ background: gradient ?? defaultGradient }}
      onClick={onClick}
    >
      <span className="absolute top-1.5 left-1.5 bg-black/55 text-[var(--neutral-0)] font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5">
        DICOM
      </span>
      <span className="absolute top-1.5 right-1.5 bg-black/55 text-[var(--neutral-0)] font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5">
        {modality}
      </span>
      <span className="absolute bottom-1.5 left-1.5 font-mono text-[10px] text-[rgba(244,239,230,0.85)] tracking-[0]">
        {date}
      </span>
      <span className="absolute bottom-1.5 right-1.5 font-mono text-[9px] text-[rgba(244,239,230,0.65)] tracking-[0]">
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   PinInput — six-box re-authentication PIN.
   ============================================================ */

export interface PinInputProps {
  readonly length?: number;
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly label?: string;
  readonly note?: string;
  readonly className?: string;
}

export function PinInput({
  length = 6,
  value = '',
  onChange,
  label,
  note,
  className = '',
}: PinInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && (value[idx] == null || value[idx] === undefined)) {
      const prev = inputsRef.current[idx - 1];
      if (prev) {
        prev.focus();
        onChange?.(value.slice(0, idx - 1));
      }
    }
  }

  function handleChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.slice(-1);
    if (!/^\d$/.test(char) && char !== '') return;
    const chars = value.split('');
    chars[idx] = char;
    const next = chars.join('').slice(0, length);
    onChange?.(next);
    if (char && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  }

  return (
    <div
      className={`bg-[var(--surface-raised)] border border-[var(--text-primary)] p-[22px] max-w-[480px] ${className}`}
    >
      {label != null && label !== undefined && (
        <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-3.5">
          {label}
        </div>
      )}
      <div className="flex gap-2">
        {Array.from({ length }, (_, i) => {
          const char = value[i] ?? '';
          const isFilled = char !== '';
          const isNext = !isFilled && (i === 0 || (value[i - 1] != null && value[i - 1] !== undefined));
          return (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={isFilled ? '•' : ''}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={[
                'w-11 h-14 text-center font-mono [font-feature-settings:"tnum"_1] text-[24px] font-medium',
                'bg-[var(--surface-raised)] rounded-sm outline-none transition-colors duration-[100ms]',
                'text-[var(--text-primary)] tracking-[0]',
                isFilled ? 'border-[1.5px] border-[var(--text-primary)]' : '',
                isNext ? 'border-[1.5px] border-b-[3px] border-[var(--text-primary)]' : '',
                !isFilled && !isNext ? 'border-[1.5px] border-[var(--text-tertiary)]' : '',
              ].join(' ')}
            />
          );
        })}
      </div>
      {note != null && note !== undefined && (
        <div className="font-serif italic text-[13px] text-[var(--text-tertiary)] mt-3.5 leading-[1.45]">
          {note}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   StarRating — five drawn stars.
   No half-stars allowed.
   ============================================================ */

export interface StarRatingProps {
  readonly value?: number;
  readonly onChange?: (value: number) => void;
  readonly max?: number;
  readonly readOnly?: boolean;
  readonly score?: number;
  readonly scoreLabel?: string;
  readonly className?: string;
}

function StarIcon({ filled, size = 22 }: { readonly filled: boolean; readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"
        fill={filled ? 'var(--text-primary)' : 'none'}
        stroke={filled ? 'var(--text-primary)' : 'var(--text-tertiary)'}
        strokeWidth={filled ? 0.6 : 1.2}
      />
    </svg>
  );
}

export function StarRating({
  value = 0,
  onChange,
  max = 5,
  readOnly = false,
  score,
  scoreLabel,
  className = '',
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className={`inline-flex items-center gap-4 ${className}`}>
      <div className="inline-flex items-center gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => setHover(null)}
            className="bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default"
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          >
            <StarIcon filled={(hover ?? value) >= n} size={22} />
          </button>
        ))}
      </div>
      {score != null && score !== undefined && (
        <div>
          <div className="font-serif text-[22px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">
            {score.toFixed(1)}
          </div>
          {scoreLabel != null && scoreLabel !== undefined && (
            <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
              {scoreLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SignaturePad — paper-tape with ruled lines.
   Static preview mode (SVG path) + clear button.
   ============================================================ */

export interface SignaturePadProps {
  readonly label?: string;
  readonly meta?: string;
  readonly signaturePath?: string;
  readonly strokeColor?: string;
  readonly quiet?: boolean;
  readonly onClear?: () => void;
  readonly className?: string;
}

export function SignaturePad({
  label = 'Signature',
  meta,
  signaturePath,
  strokeColor = 'var(--text-primary)',
  quiet = false,
  onClear,
  className = '',
}: SignaturePadProps) {
  return (
    <div
      className={`border border-[var(--text-primary)] ${quiet ? 'bg-[var(--surface-sunken)]' : 'bg-[var(--surface-raised)]'} p-[10px_14px] flex flex-col gap-1.5 ${className}`}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-serif italic text-[14px] text-[var(--text-primary)]">{label}</span>
        <div className="flex items-center gap-2">
          {meta != null && meta !== undefined && (
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">
              {meta}
            </span>
          )}
          {onClear != null && onClear !== undefined && (
            <button
              type="button"
              onClick={onClear}
              className="font-mono text-[10px] text-[var(--text-tertiary)] bg-transparent border-0 cursor-pointer uppercase tracking-[0.16em] hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div
        className="h-20 relative border-b-[1.5px] border-[var(--text-primary)]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0 19px, var(--border-default) 19px 20px)',
          padding: '0 8px',
        }}
      >
        {signaturePath != null && signaturePath !== undefined ? (
          <svg viewBox="0 0 240 60" preserveAspectRatio="none" className="w-full h-full">
            <path d={signaturePath} stroke={strokeColor} strokeWidth="1.5" fill="none" />
          </svg>
        ) : null}
        <span className="absolute bottom-1.5 left-3.5 font-serif text-[18px] text-[var(--text-tertiary)]">
          ×
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   SoapNote — structured note (S/O/A/P).
   ============================================================ */

export interface SoapSection {
  readonly key: 'S' | 'O' | 'A' | 'P';
  readonly label: string;
  readonly content: string;
}

export interface SoapNoteProps {
  readonly sections: ReadonlyArray<SoapSection>;
  readonly readOnly?: boolean;
  readonly onSectionChange?: (key: string, content: string) => void;
  readonly className?: string;
}

export function SoapNote({
  sections,
  readOnly = false,
  onSectionChange,
  className = '',
}: SoapNoteProps) {
  return (
    <div className={`border border-[var(--text-primary)] bg-[var(--surface-raised)] ${className}`}>
      {sections.map((section, i) => (
        <div
          key={section.key}
          className={`grid ${i < sections.length - 1 ? 'border-b border-[var(--border-default)]' : ''}`}
          style={{ gridTemplateColumns: '64px 1fr' }}
        >
          <div className="flex items-center justify-center border-r border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--neutral-0)] font-serif text-[28px] font-medium tracking-[-0.025em]">
            {section.key}
          </div>
          <div className="p-[14px_18px]">
            <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-1">
              {section.label}
            </div>
            {readOnly ? (
              <div
                className="font-serif text-[15px] text-[var(--text-primary)] leading-[1.55] tracking-[-0.005em]"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            ) : (
              <textarea
                value={section.content}
                onChange={(e) => onSectionChange?.(section.key, e.target.value)}
                rows={3}
                className="w-full bg-transparent border-0 outline-none font-serif text-[15px] text-[var(--text-primary)] leading-[1.55] tracking-[-0.005em] resize-none"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MarkdownEditor — clinical narration editor.
   Serif body, mono toolbar, hairline chrome.
   Toolbar buttons apply real markdown syntax to the textarea selection.
   ============================================================ */

export interface MarkdownEditorProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly savedAt?: string;
  readonly className?: string;
}

function applyInline(
  ta: HTMLTextAreaElement,
  value: string,
  onChange: ((v: string) => void) | undefined,
  prefix: string,
  suffix: string,
) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const sel = value.slice(start, end);
  const replacement = sel.length > 0 ? `${prefix}${sel}${suffix}` : `${prefix}${suffix}`;
  const next = value.slice(0, start) + replacement + value.slice(end);
  onChange?.(next);
  const cursor = sel.length > 0 ? start + replacement.length : start + prefix.length;
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(cursor, cursor);
  });
}

function applyLinePrefix(
  ta: HTMLTextAreaElement,
  value: string,
  onChange: ((v: string) => void) | undefined,
  makePrefix: (lineIdx: number) => string,
) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const before = value.slice(0, start);
  const lineStart = before.lastIndexOf('\n') + 1;
  const selected = value.slice(lineStart, end);
  const lines = selected.split('\n');
  const prefixed = lines.map((l, i) => `${makePrefix(i)}${l}`).join('\n');
  const next = value.slice(0, lineStart) + prefixed + value.slice(end);
  onChange?.(next);
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(lineStart, lineStart + prefixed.length);
  });
}

export function MarkdownEditor({
  value = '',
  onChange,
  placeholder,
  savedAt,
  className = '',
}: MarkdownEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;

  function wrap(prefix: string, suffix: string) {
    if (taRef.current == null || taRef.current === undefined) return;
    applyInline(taRef.current, value, onChange, prefix, suffix);
  }

  function linePrefix(makePrefix: (i: number) => string) {
    if (taRef.current == null || taRef.current === undefined) return;
    applyLinePrefix(taRef.current, value, onChange, makePrefix);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      wrap('**', '**');
    }
    if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      wrap('_', '_');
    }
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      wrap('[', '](url)');
    }
  }

  const btnBase =
    'bg-transparent border-0 px-1.5 py-1 cursor-pointer font-mono text-[11px] hover:text-[var(--text-primary)] transition-colors';

  return (
    <div className={`border border-[var(--text-primary)] bg-[var(--surface-raised)] ${className}`}>
      <div className="flex items-center gap-0.5 px-2.5 py-2 border-b border-[var(--text-primary)] text-[var(--text-tertiary)]">
        <button
          type="button"
          title="Bold (⌘B)"
          className={`${btnBase} font-bold`}
          onClick={() => wrap('**', '**')}
        >
          B
        </button>
        <button
          type="button"
          title="Italic (⌘I)"
          className={`${btnBase} italic`}
          onClick={() => wrap('_', '_')}
        >
          I
        </button>
        <button
          type="button"
          title="Strikethrough"
          className={`${btnBase} line-through`}
          onClick={() => wrap('~~', '~~')}
        >
          S
        </button>
        <button
          type="button"
          title="Inline code"
          className={`${btnBase} font-mono`}
          onClick={() => wrap('`', '`')}
        >
          {'`'}
        </button>
        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1 flex-shrink-0" />
        <button
          type="button"
          title="Bullet list"
          className={btnBase}
          onClick={() => linePrefix(() => '- ')}
        >
          •
        </button>
        <button
          type="button"
          title="Numbered list"
          className={btnBase}
          onClick={() => linePrefix((i) => `${i + 1}. `)}
        >
          1.
        </button>
        <button
          type="button"
          title="Quote block"
          className={btnBase}
          onClick={() => linePrefix(() => '> ')}
        >
          ›
        </button>
        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1 flex-shrink-0" />
        <button
          type="button"
          title="Code block"
          className={btnBase}
          onClick={() => wrap('```\n', '\n```')}
        >
          {'{ }'}
        </button>
        <button
          type="button"
          title="Link (⌘K)"
          className={btnBase}
          onClick={() => wrap('[', '](url)')}
        >
          {'🔗'}
        </button>
        <button
          type="button"
          title="Heading"
          className={btnBase}
          onClick={() => linePrefix(() => '## ')}
        >
          H
        </button>
        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1 flex-shrink-0" />
        <button
          type="button"
          title="Mention staff or patient"
          className={btnBase}
          onClick={() => wrap('@', '')}
        >
          @
        </button>
        <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
          ⌘B · ⌘I · ⌘K
        </span>
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={6}
        className="w-full bg-transparent border-0 outline-none p-[16px_18px] font-serif text-[15px] text-[var(--text-primary)] leading-[1.6] tracking-[-0.005em] resize-y placeholder:text-[var(--text-disabled)]"
      />
      <div className="flex justify-between px-3.5 py-2 border-t border-[var(--text-primary)] font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">
        <span>Mention @ · ⌘B bold · ⌘I italic · ⌘K link</span>
        <span>
          {savedAt != null && savedAt !== undefined ? `auto-saved ${savedAt} · ` : ''}
          {charCount} chars
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   BodyDiagram — front + back SVG body map with marked regions.
   Features: click to add, drag to move, select to edit label/color, delete.
   allowFullView opens an overlay fullscreen view.
   ============================================================ */

export interface BodyMarking {
  readonly id: string;
  readonly view: 'anterior' | 'posterior';
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly label: string;
  readonly color: 'danger' | 'warning' | 'info';
}

export interface BodyDiagramProps {
  readonly markings?: ReadonlyArray<BodyMarking>;
  readonly onMark?: (view: 'anterior' | 'posterior', x: number, y: number) => void;
  readonly onMarkingsChange?: (markings: BodyMarking[]) => void;
  readonly allowFullView?: boolean;
  readonly className?: string;
}

const MARKING_COLORS: Record<BodyMarking['color'], { fill: string; stroke: string; text: string }> = {
  danger: { fill: 'var(--danger-bg)', stroke: 'var(--danger-icon)', text: 'var(--danger-icon)' },
  warning: { fill: 'var(--warning-bg)', stroke: 'var(--warning-icon)', text: 'var(--warning-icon)' },
  info: { fill: 'var(--patient-50)', stroke: 'var(--patient-600)', text: 'var(--patient-700)' },
};

const MARKING_COLOR_LABELS: Record<BodyMarking['color'], string> = {
  danger: 'Danger',
  warning: 'Warning',
  info: 'Info',
};

function LandmarkDot({ cx, cy, label }: { readonly cx: number; readonly cy: number; readonly label: string }) {
  return (
    <g>
      <title>{label}</title>
      <circle cx={cx} cy={cy} r="2.2" fill="var(--surface-raised)" stroke="var(--text-tertiary)" strokeWidth="0.8" />
      <text x={cx} y={cy - 3.5} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="4.2" fill="var(--text-tertiary)">{label}</text>
    </g>
  );
}

const ANTERIOR_LANDMARKS = [
  { cx: 50, cy: 10, label: 'Crown' },
  { cx: 39, cy: 17, label: 'R Temple' },
  { cx: 61, cy: 17, label: 'L Temple' },
  { cx: 37, cy: 26, label: 'R Ear' },
  { cx: 63, cy: 26, label: 'L Ear' },
  { cx: 50, cy: 30, label: 'Jaw' },
  { cx: 30, cy: 44, label: 'R Shoulder' },
  { cx: 70, cy: 44, label: 'L Shoulder' },
  { cx: 50, cy: 60, label: 'Sternum' },
  { cx: 38, cy: 65, label: 'R Chest' },
  { cx: 62, cy: 65, label: 'L Chest' },
  { cx: 15, cy: 80, label: 'R Elbow' },
  { cx: 85, cy: 80, label: 'L Elbow' },
  { cx: 50, cy: 100, label: 'Abdomen' },
  { cx: 50, cy: 116, label: 'Navel' },
  { cx: 12, cy: 110, label: 'R Wrist' },
  { cx: 88, cy: 110, label: 'L Wrist' },
  { cx: 38, cy: 128, label: 'R Hip' },
  { cx: 62, cy: 128, label: 'L Hip' },
  { cx: 50, cy: 132, label: 'Groin' },
  { cx: 38, cy: 170, label: 'R Knee' },
  { cx: 62, cy: 170, label: 'L Knee' },
  { cx: 36, cy: 200, label: 'R Ankle' },
  { cx: 64, cy: 200, label: 'L Ankle' },
  { cx: 34, cy: 212, label: 'R Foot' },
  { cx: 66, cy: 212, label: 'L Foot' },
];

const POSTERIOR_LANDMARKS = [
  { cx: 50, cy: 10, label: 'Crown' },
  { cx: 37, cy: 26, label: 'R Ear' },
  { cx: 63, cy: 26, label: 'L Ear' },
  { cx: 50, cy: 30, label: 'Occiput' },
  { cx: 50, cy: 38, label: 'C-spine' },
  { cx: 30, cy: 44, label: 'R Shoulder' },
  { cx: 70, cy: 44, label: 'L Shoulder' },
  { cx: 38, cy: 58, label: 'R Scapula' },
  { cx: 62, cy: 58, label: 'L Scapula' },
  { cx: 50, cy: 70, label: 'T-spine' },
  { cx: 15, cy: 80, label: 'R Elbow' },
  { cx: 85, cy: 80, label: 'L Elbow' },
  { cx: 50, cy: 95, label: 'L-spine' },
  { cx: 12, cy: 110, label: 'R Wrist' },
  { cx: 88, cy: 110, label: 'L Wrist' },
  { cx: 50, cy: 118, label: 'Sacrum' },
  { cx: 38, cy: 128, label: 'R Buttock' },
  { cx: 62, cy: 128, label: 'L Buttock' },
  { cx: 38, cy: 170, label: 'R Knee' },
  { cx: 62, cy: 170, label: 'L Knee' },
  { cx: 50, cy: 185, label: 'Calf' },
  { cx: 36, cy: 200, label: 'R Ankle' },
  { cx: 64, cy: 200, label: 'L Ankle' },
  { cx: 34, cy: 212, label: 'R Heel' },
  { cx: 66, cy: 212, label: 'L Heel' },
];

function BodySvgCanvas({
  view,
  markings,
  selectedId,
  onMark,
  onSelect,
  onMove,
  compact = false,
}: {
  readonly view: 'anterior' | 'posterior';
  readonly markings: ReadonlyArray<BodyMarking>;
  readonly selectedId: string | null;
  readonly onMark?: (view: 'anterior' | 'posterior', x: number, y: number) => void;
  readonly onSelect: (id: string | null) => void;
  readonly onMove: (id: string, cx: number, cy: number) => void;
  readonly compact?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<{ id: string; startClientX: number; startClientY: number; startCx: number; startCy: number } | null>(null);
  const myMarkings = markings.filter((m) => m.view === view);
  const landmarks = view === 'anterior' ? ANTERIOR_LANDMARKS : POSTERIOR_LANDMARKS;
  const w = compact ? 150 : 180;
  const h = compact ? 300 : 360;

  function svgCoords(clientX: number, clientY: number): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 220,
    };
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (draggingRef.current != null) return;
    const { x, y } = svgCoords(e.clientX, e.clientY);
    onSelect(null);
    onMark?.(view, Math.round(x), Math.round(y));
  }

  function handleMarkPointerDown(e: React.PointerEvent<SVGGElement>, m: BodyMarking) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = { id: m.id, startClientX: e.clientX, startClientY: e.clientY, startCx: m.cx, startCy: m.cy };
    onSelect(m.id);
  }

  function handleMarkPointerMove(e: React.PointerEvent<SVGGElement>) {
    const d = draggingRef.current;
    if (!d) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = 100 / rect.width;
    const scaleY = 220 / rect.height;
    const newCx = Math.max(5, Math.min(95, Math.round(d.startCx + dx * scaleX)));
    const newCy = Math.max(5, Math.min(215, Math.round(d.startCy + dy * scaleY)));
    onMove(d.id, newCx, newCy);
  }

  function handleMarkPointerUp(e: React.PointerEvent<SVGGElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    draggingRef.current = null;
  }

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] p-3 flex-shrink-0">
      <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2">
        {view === 'anterior' ? 'Anterior' : 'Posterior'}
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 100 220"
        width={w}
        height={h}
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth="1"
        onClick={handleSvgClick}
        className="cursor-crosshair block"
      >
        <circle cx="50" cy="22" r="13" fill="var(--surface-sunken)" />
        <path d="M 44 33 L 44 42 L 56 42 L 56 33 Z" fill="var(--surface-sunken)" />
        <path d="M 30 42 Q 30 80 36 130 L 64 130 Q 70 80 70 42 Z" fill="var(--surface-sunken)" />
        <path d="M 30 44 Q 18 70 14 110 L 22 112 Q 26 76 36 50 Z" fill="var(--surface-sunken)" />
        <path d="M 70 44 Q 82 70 86 110 L 78 112 Q 74 76 64 50 Z" fill="var(--surface-sunken)" />
        <path d="M 36 130 L 32 210 L 48 210 L 48 132 Z" fill="var(--surface-sunken)" />
        <path d="M 64 130 L 68 210 L 52 210 L 52 132 Z" fill="var(--surface-sunken)" />
        {view === 'posterior' && (
          <line x1="50" y1="35" x2="50" y2="120" stroke="var(--border-default)" strokeWidth="0.6" strokeDasharray="2 2" />
        )}
        {landmarks.map((lm) => (
          <LandmarkDot key={lm.label} cx={lm.cx} cy={lm.cy} label={lm.label} />
        ))}
        {myMarkings.map((m) => {
          const c = MARKING_COLORS[m.color];
          const isSelected = m.id === selectedId;
          return (
            <g
              key={m.id}
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => handleMarkPointerDown(e, m)}
              onPointerMove={handleMarkPointerMove}
              onPointerUp={handleMarkPointerUp}
            >
              {isSelected && (
                <ellipse
                  cx={m.cx}
                  cy={m.cy}
                  rx={m.rx + 3}
                  ry={m.ry + 3}
                  fill="none"
                  stroke="var(--brand-500)"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
              )}
              <ellipse
                cx={m.cx}
                cy={m.cy}
                rx={m.rx}
                ry={m.ry}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth="1.5"
                opacity="0.9"
              />
              <text
                x={m.cx}
                y={m.cy + 3}
                textAnchor="middle"
                fontFamily="JetBrains Mono"
                fontSize="6"
                fill={c.text}
                fontWeight="600"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MarkingEditor({
  marking,
  onUpdate,
  onDelete,
}: {
  readonly marking: BodyMarking;
  readonly onUpdate: (patch: Partial<Pick<BodyMarking, 'label' | 'color'>>) => void;
  readonly onDelete: () => void;
}) {
  return (
    <div className="border border-[var(--brand-500)] bg-[var(--surface-raised)] p-4 flex flex-col gap-3 min-w-[180px]">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Edit marking
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.12em]">Label</label>
        <input
          type="text"
          value={marking.label}
          maxLength={8}
          onChange={(e) => onUpdate({ label: e.target.value.toUpperCase() })}
          className="border border-[var(--border-default)] bg-[var(--surface-sunken)] px-2 py-1.5 font-mono text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--brand-500)] w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.12em]">Color</label>
        <div className="flex gap-2">
          {(Object.keys(MARKING_COLORS) as BodyMarking['color'][]).map((key) => {
            const c = MARKING_COLORS[key];
            const isActive = marking.color === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onUpdate({ color: key })}
                title={MARKING_COLOR_LABELS[key]}
                className={[
                  'w-6 h-6 rounded-full border-2 transition-transform duration-100',
                  isActive ? 'scale-125 border-[var(--text-primary)]' : 'border-transparent hover:scale-110',
                ].join(' ')}
                style={{ background: c.stroke }}
              />
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="mt-1 font-mono text-[11px] text-[var(--danger-icon)] bg-transparent border border-[var(--danger-icon)] px-3 py-1.5 hover:bg-[var(--danger-bg)] transition-colors duration-100 cursor-pointer"
      >
        Remove marking
      </button>
    </div>
  );
}

export function BodyDiagram({ markings = [], onMark, onMarkingsChange, allowFullView = false, className = '' }: BodyDiagramProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullView, setFullView] = useState(false);

  const selectedMarking = selectedId != null ? markings.find((m) => m.id === selectedId) ?? null : null;

  function handleMove(id: string, cx: number, cy: number) {
    if (!onMarkingsChange) return;
    onMarkingsChange(markings.map((m) => m.id === id ? { ...m, cx, cy } : m) as BodyMarking[]);
  }

  function handleUpdate(patch: Partial<Pick<BodyMarking, 'label' | 'color'>>) {
    if (!onMarkingsChange || !selectedId) return;
    onMarkingsChange(markings.map((m) => m.id === selectedId ? { ...m, ...patch } : m) as BodyMarking[]);
  }

  function handleDelete() {
    if (!onMarkingsChange || !selectedId) return;
    onMarkingsChange(markings.filter((m) => m.id !== selectedId) as BodyMarking[]);
    setSelectedId(null);
  }

  const svgProps = {
    markings,
    selectedId,
    onMark,
    onSelect: setSelectedId,
    onMove: handleMove,
  };

  const diagramContent = (compact: boolean) => (
    <div className="flex gap-4 items-start flex-wrap">
      <BodySvgCanvas view="anterior" {...svgProps} compact={compact} />
      <BodySvgCanvas view="posterior" {...svgProps} compact={compact} />
      {selectedMarking != null && onMarkingsChange != null && onMarkingsChange !== undefined && (
        <div className="self-center">
          <MarkingEditor marking={selectedMarking} onUpdate={handleUpdate} onDelete={handleDelete} />
        </div>
      )}
      {selectedMarking == null && markings.length > 0 && (
        <div className="pt-8">
          <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-3">
            Marked regions
          </div>
          <ul className="flex flex-col gap-2 p-0 m-0 list-none">
            {markings.map((m) => {
              const c = MARKING_COLORS[m.color];
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className="flex items-baseline gap-2 font-serif italic text-[14px] text-[var(--text-primary)] bg-transparent border-0 p-0 cursor-pointer hover:underline"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0 translate-y-[-1px]" style={{ background: c.stroke }} />
                    {m.view === 'anterior' ? 'Ant' : 'Post'} — {m.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
          Click diagram to add · drag marking to move · click marking to select
        </span>
        {allowFullView && (
          <button
            type="button"
            onClick={() => setFullView(true)}
            className="ml-auto font-mono text-[11px] text-[var(--brand-600)] bg-transparent border border-[var(--brand-300)] px-2.5 py-1 hover:bg-[var(--brand-50)] transition-colors duration-100 cursor-pointer"
          >
            Full view
          </button>
        )}
      </div>

      {diagramContent(false)}

      {fullView && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
          onClick={() => setFullView(false)}
        >
          <div
            className="bg-[var(--surface-raised)] border border-[var(--text-primary)] p-6 overflow-auto max-h-screen max-w-[calc(100vw-48px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-[0.14em]">
                Body Diagram — Full View
              </span>
              <button
                type="button"
                onClick={() => setFullView(false)}
                className="w-7 h-7 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-transparent border-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            {diagramContent(false)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MarkdownViewer — renders children content as formatted markdown.
   Uses react-markdown; serif body, mono code, hairline rules.
   ============================================================ */

export interface MarkdownViewerProps {
  readonly children: string;
  readonly className?: string;
}

export function MarkdownViewer({ children, className = '' }: MarkdownViewerProps) {
  return (
    <div
      className={[
        'font-serif text-[15px] leading-[1.65] tracking-[-0.005em] text-[var(--text-primary)]',
        '[&_h1]:font-serif [&_h1]:text-[28px] [&_h1]:font-medium [&_h1]:tracking-[-0.022em] [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:leading-[1.15]',
        '[&_h2]:font-serif [&_h2]:text-[22px] [&_h2]:font-medium [&_h2]:tracking-[-0.012em] [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:leading-[1.2]',
        '[&_h3]:font-serif [&_h3]:text-[18px] [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4',
        '[&_p]:mb-[14px] [&_p]:last:mb-0',
        '[&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]',
        '[&_em]:italic [&_em]:text-[var(--text-secondary)]',
        '[&_del]:line-through [&_del]:text-[var(--text-tertiary)]',
        '[&_a]:text-[var(--records-700)] [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-[var(--records-800)]',
        '[&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-[var(--surface-sunken)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-[2px] [&_code]:text-[var(--text-primary)]',
        '[&_pre]:bg-[var(--surface-sunken)] [&_pre]:border [&_pre]:border-[var(--border-default)] [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[13px]',
        '[&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--text-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--text-secondary)] [&_blockquote]:mb-4',
        '[&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:list-disc',
        '[&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal',
        '[&_li]:mb-1',
        '[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[var(--border-default)] [&_hr]:my-5',
        '[&_table]:w-full [&_table]:border-collapse [&_table]:mb-4',
        '[&_th]:font-mono [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-[0.14em] [&_th]:text-[var(--text-tertiary)] [&_th]:border-b [&_th]:border-[var(--text-primary)] [&_th]:py-2 [&_th]:text-left',
        '[&_td]:border-b [&_td]:border-dashed [&_td]:border-[var(--border-default)] [&_td]:py-2 [&_td]:text-[14px]',
        className,
      ].join(' ')}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
