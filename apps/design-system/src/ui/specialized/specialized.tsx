import { X, Paperclip } from '@icons';
import { useCallback, useRef, useState } from 'react';

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

const DZ_VARIANTS: Record<DropZoneState, { border: string; bg: string; titleColor: string; glyph: string }> = {
  idle: { border: 'border-[var(--text-tertiary)]', bg: 'bg-[var(--surface-raised)]', titleColor: 'text-[var(--text-primary)]', glyph: '↑' },
  hover: { border: 'border-[var(--text-primary)]', bg: 'bg-[var(--surface-sunken)]', titleColor: 'text-[var(--text-primary)]', glyph: '↑' },
  ok: { border: 'border-[var(--records-700)]', bg: 'bg-[var(--records-50)]', titleColor: 'text-[var(--records-800)]', glyph: '✓' },
  error: { border: 'border-[var(--danger-icon)]', bg: 'bg-[var(--danger-bg)]', titleColor: 'text-[var(--danger-icon)]', glyph: '×' },
};

export function DropZone({ state = 'idle', onDrop, accept, label, sublabel, className = '' }: DropZoneProps) {
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragState('idle');
    if (e.dataTransfer.files.length > 0) {
      onDrop?.(e.dataTransfer.files);
    }
  }, [onDrop]);

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
        v.border, v.bg, className,
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input ref={inputRef} type="file" accept={accept} multiple className="sr-only" onChange={handleChange} />
      <div className="font-serif text-[36px] text-[var(--text-primary)] leading-none">{v.glyph}</div>
      <div className={`font-serif italic text-[18px] mt-2.5 tracking-[-0.005em] ${v.titleColor}`}>
        {label ?? (effectiveState === 'ok' ? 'Files uploaded.' : effectiveState === 'error' ? 'Upload failed.' : 'Drop a file or click to upload.')}
      </div>
      {sublabel != null && (
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
  const nameColor = status === 'ok' ? 'text-[var(--records-800)]' : status === 'error' ? 'text-[var(--danger-icon)]' : 'text-[var(--text-primary)]';

  return (
    <div className="grid items-center gap-3 py-3 border-b border-dashed border-[var(--border-default)] last:border-b-0" style={{ gridTemplateColumns: '18px 1fr auto auto' }}>
      <Paperclip size={14} className="text-[var(--text-tertiary)]" />
      <span className={`text-[14px] ${nameColor}`}>{name}</span>
      {status === 'uploading' && progress != null ? (
        <div className="w-[120px] h-1 bg-[var(--surface-sunken)]">
          <div className="h-full bg-[var(--text-primary)] transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
          {statusLabel ?? status}
        </span>
      )}
      <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
        {status === 'uploading' && progress != null ? `${progress}%${size ? ` · ${size}` : ''}` : size ?? ''}
        {onRemove != null && (
          <button type="button" onClick={onRemove} className="ml-1.5 text-[var(--text-tertiary)] bg-transparent border-0 cursor-pointer p-0">
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

export function DicomThumb({ modality, date, label, gradient, onClick, className = '' }: DicomThumbProps) {
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

export function PinInput({ length = 6, value = '', onChange, label, note, className = '' }: PinInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && value[idx] == null) {
      const prev = inputsRef.current[idx - 1];
      if (prev) { prev.focus(); onChange?.(value.slice(0, idx - 1)); }
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
    <div className={`bg-[var(--surface-raised)] border border-[var(--text-primary)] p-[22px] max-w-[480px] ${className}`}>
      {label != null && (
        <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-3.5">
          {label}
        </div>
      )}
      <div className="flex gap-2">
        {Array.from({ length }, (_, i) => {
          const char = value[i] ?? '';
          const isFilled = char !== '';
          const isNext = !isFilled && (i === 0 || value[i - 1] != null);
          return (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
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
      {note != null && (
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

export function StarRating({ value = 0, onChange, max = 5, readOnly = false, score, scoreLabel, className = '' }: StarRatingProps) {
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
      {score != null && (
        <div>
          <div className="font-serif text-[22px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">
            {score.toFixed(1)}
          </div>
          {scoreLabel != null && (
            <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{scoreLabel}</div>
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

export function SignaturePad({ label = 'Signature', meta, signaturePath, strokeColor = 'var(--text-primary)', quiet = false, onClear, className = '' }: SignaturePadProps) {
  return (
    <div className={`border border-[var(--text-primary)] ${quiet ? 'bg-[var(--surface-sunken)]' : 'bg-[var(--surface-raised)]'} p-[10px_14px] flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between">
        <span className="font-serif italic text-[14px] text-[var(--text-primary)]">{label}</span>
        <div className="flex items-center gap-2">
          {meta != null && <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">{meta}</span>}
          {onClear != null && (
            <button type="button" onClick={onClear} className="font-mono text-[10px] text-[var(--text-tertiary)] bg-transparent border-0 cursor-pointer uppercase tracking-[0.16em] hover:text-[var(--text-primary)]">
              Clear
            </button>
          )}
        </div>
      </div>
      <div
        className="h-20 relative border-b-[1.5px] border-[var(--text-primary)]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent 0 19px, var(--border-default) 19px 20px)', padding: '0 8px' }}
      >
        {signaturePath != null ? (
          <svg viewBox="0 0 240 60" preserveAspectRatio="none" className="w-full h-full">
            <path d={signaturePath} stroke={strokeColor} strokeWidth="1.5" fill="none" />
          </svg>
        ) : null}
        <span className="absolute bottom-1.5 left-3.5 font-serif text-[18px] text-[var(--text-tertiary)]">×</span>
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

export function SoapNote({ sections, readOnly = false, onSectionChange, className = '' }: SoapNoteProps) {
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
   ============================================================ */

export interface MarkdownEditorProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly savedAt?: string;
  readonly className?: string;
}

const TOOLBAR_ACTIONS = [
  { label: 'B', bold: true },
  { label: 'I', italic: true },
  { label: 'U', underline: true },
] as const;

export function MarkdownEditor({ value = '', onChange, placeholder, savedAt, className = '' }: MarkdownEditorProps) {
  const charCount = value.length;

  return (
    <div className={`border border-[var(--text-primary)] bg-[var(--surface-raised)] ${className}`}>
      <div className="flex items-center gap-1 px-2.5 py-2 border-b border-[var(--text-primary)] text-[var(--text-tertiary)] font-mono text-[11px]">
        <button type="button" className="bg-transparent border-0 font-bold text-[var(--text-primary)] border-b-[1.5px] border-[var(--text-primary)] px-1.5 py-1 cursor-pointer">B</button>
        <button type="button" className="bg-transparent border-0 italic px-1.5 py-1 cursor-pointer hover:text-[var(--text-primary)]">I</button>
        <button type="button" className="bg-transparent border-0 underline px-1.5 py-1 cursor-pointer hover:text-[var(--text-primary)]">U</button>
        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1" />
        <button type="button" className="bg-transparent border-0 px-1.5 py-1 cursor-pointer hover:text-[var(--text-primary)]">•</button>
        <button type="button" className="bg-transparent border-0 px-1.5 py-1 cursor-pointer hover:text-[var(--text-primary)]">1.</button>
        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1" />
        <button type="button" className="bg-transparent border-0 px-1.5 py-1 cursor-pointer hover:text-[var(--text-primary)]">{'{ }'}</button>
        <button type="button" className="bg-transparent border-0 px-1.5 py-1 cursor-pointer hover:text-[var(--text-primary)]">{'" "'}</button>
        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1" />
        <button type="button" className="bg-transparent border-0 px-1.5 py-1 cursor-pointer hover:text-[var(--text-primary)]">@</button>
        <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)]">⌘B · ⌘I · ⌘K</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full bg-transparent border-0 outline-none p-[16px_18px] font-serif text-[15px] text-[var(--text-primary)] leading-[1.6] tracking-[-0.005em] resize-none placeholder:text-[var(--text-disabled)]"
      />
      <div className="flex justify-between px-3.5 py-2 border-t border-[var(--text-primary)] font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">
        <span>Mention @ to tag staff or patient</span>
        <span>{savedAt != null ? `auto-saved ${savedAt} · ` : ''}{charCount} chars</span>
      </div>
    </div>
  );
}

/* ============================================================
   BodyDiagram — front + back SVG body map with marked regions.
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
  readonly className?: string;
}

const MARKING_COLORS: Record<BodyMarking['color'], { fill: string; stroke: string; text: string }> = {
  danger: { fill: 'var(--danger-bg)', stroke: 'var(--danger-icon)', text: 'var(--danger-icon)' },
  warning: { fill: 'var(--warning-bg)', stroke: 'var(--warning-icon)', text: 'var(--warning-icon)' },
  info: { fill: 'var(--patient-50)', stroke: 'var(--patient-600)', text: 'var(--patient-700)' },
};

function BodySvg({ view, markings = [], onMark }: { readonly view: 'anterior' | 'posterior'; readonly markings: ReadonlyArray<BodyMarking>; readonly onMark?: (view: 'anterior' | 'posterior', x: number, y: number) => void }) {
  const myMarkings = markings.filter(m => m.view === view);

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 220;
    onMark?.(view, x, y);
  }

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] p-3">
      <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2">
        {view === 'anterior' ? 'Anterior' : 'Posterior'}
      </div>
      <svg
        viewBox="0 0 100 220"
        width="160"
        height="320"
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth="1"
        onClick={handleClick}
        className="cursor-crosshair"
      >
        <circle cx="50" cy="22" r="13" fill="var(--surface-sunken)" />
        <path d="M 44 33 L 44 42 L 56 42 L 56 33 Z" fill="var(--surface-sunken)" />
        <path d="M 30 42 Q 30 80 36 130 L 64 130 Q 70 80 70 42 Z" fill="var(--surface-sunken)" />
        <path d="M 30 44 Q 18 70 14 110 L 22 112 Q 26 76 36 50 Z" fill="var(--surface-sunken)" />
        <path d="M 70 44 Q 82 70 86 110 L 78 112 Q 74 76 64 50 Z" fill="var(--surface-sunken)" />
        <path d="M 36 130 L 32 210 L 48 210 L 48 132 Z" fill="var(--surface-sunken)" />
        <path d="M 64 130 L 68 210 L 52 210 L 52 132 Z" fill="var(--surface-sunken)" />
        {view === 'anterior' ? (
          <>
            <circle cx="38" cy="60" r="3" fill="var(--surface-raised)" stroke="var(--text-tertiary)" />
            <circle cx="62" cy="60" r="3" fill="var(--surface-raised)" stroke="var(--text-tertiary)" />
            <circle cx="50" cy="110" r="3" fill="var(--surface-raised)" stroke="var(--text-tertiary)" />
            <circle cx="40" cy="160" r="3" fill="var(--surface-raised)" stroke="var(--text-tertiary)" />
            <circle cx="60" cy="160" r="3" fill="var(--surface-raised)" stroke="var(--text-tertiary)" />
          </>
        ) : (
          <>
            <circle cx="50" cy="60" r="3" fill="var(--surface-raised)" stroke="var(--text-tertiary)" />
            <circle cx="38" cy="80" r="3" fill="var(--surface-raised)" stroke="var(--text-tertiary)" />
            <circle cx="62" cy="80" r="3" fill="var(--surface-raised)" stroke="var(--text-tertiary)" />
          </>
        )}
        {myMarkings.map((m) => {
          const c = MARKING_COLORS[m.color];
          return (
            <g key={m.id}>
              <ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
              <text x={m.cx} y={m.cy + 3} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="6" fill={c.text} fontWeight="600">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function BodyDiagram({ markings = [], onMark, className = '' }: BodyDiagramProps) {
  const MARKING_COLOR_KEYS: Record<BodyMarking['color'], string> = {
    danger: 'var(--danger-icon)',
    warning: 'var(--warning-icon)',
    info: 'var(--patient-600)',
  };

  return (
    <div className={`flex gap-5 items-start flex-wrap ${className}`}>
      <BodySvg view="anterior" markings={markings} onMark={onMark} />
      <BodySvg view="posterior" markings={markings} onMark={onMark} />
      {markings.length > 0 && (
        <div className="pt-8">
          <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-3">
            Marked regions
          </div>
          <ul className="flex flex-col gap-2 p-0 m-0 list-none">
            {markings.map((m) => (
              <li key={m.id} className="flex items-baseline gap-2 font-serif italic text-[14px] text-[var(--text-primary)]">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 translate-y-[-1px]"
                  style={{ background: MARKING_COLOR_KEYS[m.color] }}
                />
                {m.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
