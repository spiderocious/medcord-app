import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from '@icons';
import { useState, useRef, useEffect } from 'react';

/* ============================================================
   Shared utils
   ============================================================ */

const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

/* ============================================================
   Calendar — single date picker.
   Hairline grid, mono dates. Today is circled. Selected filled.
   ============================================================ */

export interface CalendarProps {
  readonly value?: Date;
  readonly onChange?: (date: Date) => void;
  readonly markedDates?: ReadonlyArray<Date>;
  readonly unavailableDates?: ReadonlyArray<Date>;
  readonly className?: string;
}

export function Calendar({ value, onChange, markedDates = [], unavailableDates = [], className = '' }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function handleSelect(day: number) {
    const date = new Date(viewYear, viewMonth, day);
    const unavail = unavailableDates.some(d => isSameDay(d, date));
    if (!unavail) onChange?.(date);
  }

  const cells: Array<{ day: number; type: 'prev' | 'current' | 'next'; date: Date }> = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, type: 'prev', date: new Date(viewYear, viewMonth - 1, prevMonthDays - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: 'current', date: new Date(viewYear, viewMonth, d) });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, type: 'next', date: new Date(viewYear, viewMonth + 1, d) });
    }
  }

  return (
    <div className={`bg-[var(--surface-raised)] border border-[var(--text-primary)] p-[18px_20px] w-[280px] ${className}`}>
      <div className="flex items-baseline justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="bg-transparent border-0 text-[var(--text-tertiary)] font-mono text-[13px] cursor-pointer p-0 px-1.5 hover:text-[var(--text-primary)]"
          aria-label="Previous month"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="font-serif text-[18px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="bg-transparent border-0 text-[var(--text-tertiary)] font-mono text-[13px] cursor-pointer p-0 px-1.5 hover:text-[var(--text-primary)]"
          aria-label="Next month"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DOW_LABELS.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const isSelected = value != null && isSameDay(cell.date, value);
          const isTodayCell = cell.type === 'current' && isToday(viewYear, viewMonth, cell.day);
          const isMarked = markedDates.some(d => isSameDay(d, cell.date));
          const isUnavail = unavailableDates.some(d => isSameDay(d, cell.date));
          const isMuted = cell.type !== 'current';

          return (
            <button
              key={i}
              type="button"
              onClick={() => { if (cell.type === 'current') handleSelect(cell.day); }}
              disabled={isUnavail}
              className={[
                'aspect-square flex items-center justify-center font-mono [font-feature-settings:"tnum"_1] text-[13px] rounded-sm transition-colors duration-[100ms] relative border-0',
                isMuted ? 'text-[var(--text-disabled)] cursor-default bg-transparent' : '',
                !isMuted && !isSelected && !isUnavail ? 'text-[var(--text-primary)] cursor-pointer hover:bg-[var(--surface-sunken)]' : '',
                isSelected ? 'bg-[var(--text-primary)] text-[var(--neutral-0)] cursor-pointer' : '',
                isTodayCell && !isSelected ? 'border border-[var(--text-primary)] font-semibold' : '',
                isUnavail ? 'text-[var(--text-disabled)] line-through decoration-[1px] cursor-not-allowed opacity-60' : '',
              ].join(' ')}
            >
              {cell.day}
              {isMarked && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--records-700)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   DateRangePicker — pen-stroke between two days.
   ============================================================ */

export interface DateRange {
  readonly start?: Date;
  readonly end?: Date;
}

export interface DateRangePickerProps {
  readonly value?: DateRange;
  readonly onChange?: (range: DateRange) => void;
  readonly unavailableDates?: ReadonlyArray<Date>;
  readonly className?: string;
}

export function DateRangePicker({ value, onChange, unavailableDates = [], className = '' }: DateRangePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function handleSelect(date: Date) {
    if (unavailableDates.some(d => isSameDay(d, date))) return;
    if (value?.start == null || value.end != null) {
      onChange?.({ start: date, end: undefined });
    } else if (date < value.start) {
      onChange?.({ start: date, end: value.start });
    } else {
      onChange?.({ start: value.start, end: date });
    }
  }

  const cells: Array<{ day: number; type: 'prev' | 'current' | 'next'; date: Date }> = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, type: 'prev', date: new Date(viewYear, viewMonth - 1, prevMonthDays - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: 'current', date: new Date(viewYear, viewMonth, d) });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, type: 'next', date: new Date(viewYear, viewMonth + 1, d) });
    }
  }

  const rangeStart = value?.start;
  const rangeEnd = value?.end ?? (rangeStart != null && hoverDate != null && hoverDate > rangeStart ? hoverDate : undefined);

  function workingDaysCount(start?: Date, end?: Date): number {
    if (start == null || end == null) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  const workDays = workingDaysCount(rangeStart, rangeEnd);

  function formatDate(d?: Date) {
    if (d == null) return '—';
    return `${d.getDate()} ${(MONTH_NAMES[d.getMonth()] ?? '').slice(0, 3)}`;
  }

  return (
    <div className={`bg-[var(--surface-raised)] border border-[var(--text-primary)] p-[18px_20px] w-[280px] ${className}`}>
      <div className="flex items-baseline justify-between mb-3">
        <button type="button" onClick={prevMonth} className="bg-transparent border-0 text-[var(--text-tertiary)] cursor-pointer p-0 px-1.5 hover:text-[var(--text-primary)]" aria-label="Previous month">
          <ChevronLeft size={14} />
        </button>
        <span className="font-serif text-[18px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="bg-transparent border-0 text-[var(--text-tertiary)] cursor-pointer p-0 px-1.5 hover:text-[var(--text-primary)]" aria-label="Next month">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DOW_LABELS.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const isMuted = cell.type !== 'current';
          const isUnavail = unavailableDates.some(d => isSameDay(d, cell.date));
          const isTodayCell = cell.type === 'current' && isToday(viewYear, viewMonth, cell.day);
          const isRangeStart = rangeStart != null && isSameDay(cell.date, rangeStart);
          const isRangeEnd = rangeEnd != null && isSameDay(cell.date, rangeEnd);
          const isInRange = rangeStart != null && rangeEnd != null && cell.date > rangeStart && cell.date < rangeEnd;

          return (
            <button
              key={i}
              type="button"
              onClick={() => !isMuted && handleSelect(cell.date)}
              onMouseEnter={() => setHoverDate(cell.date)}
              onMouseLeave={() => setHoverDate(null)}
              disabled={isUnavail}
              className={[
                'aspect-square flex items-center justify-center font-mono [font-feature-settings:"tnum"_1] text-[13px] transition-colors duration-[100ms] border-0',
                isMuted ? 'text-[var(--text-disabled)] cursor-default bg-transparent' : '',
                !isMuted && !isRangeStart && !isRangeEnd && !isInRange ? 'text-[var(--text-primary)] cursor-pointer hover:bg-[var(--surface-sunken)]' : '',
                isRangeStart ? 'bg-[var(--text-primary)] text-[var(--neutral-0)] rounded-l-sm cursor-pointer' : '',
                isRangeEnd ? 'bg-[var(--text-primary)] text-[var(--neutral-0)] rounded-r-sm cursor-pointer' : '',
                isInRange ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)] rounded-none cursor-pointer' : '',
                isTodayCell && !isRangeStart && !isRangeEnd ? 'border border-[var(--text-primary)] font-semibold rounded-sm' : '',
                isUnavail ? 'text-[var(--text-disabled)] line-through decoration-[1px] cursor-not-allowed opacity-60' : '',
                isRangeStart && isRangeEnd ? '!rounded-sm' : '',
              ].join(' ')}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {(rangeStart != null || rangeEnd != null) && (
        <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0] mt-2.5 text-center">
          {formatDate(rangeStart)} → {formatDate(rangeEnd)}{workDays > 0 ? ` · ${workDays} working days` : ''}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TimeDrum — drum-roll hour/minute/second picker.
   Clinical time, 24-hour.
   ============================================================ */

export interface TimeValue {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds?: number;
}

export interface TimeDrumProps {
  readonly value?: TimeValue;
  readonly onChange?: (value: TimeValue) => void;
  readonly showSeconds?: boolean;
  readonly className?: string;
}

function DrumColumn({
  values,
  selected,
  onSelect,
  label,
}: {
  readonly values: ReadonlyArray<number>;
  readonly selected: number;
  readonly onSelect: (v: number) => void;
  readonly label: string;
}) {
  const colRef = useRef<HTMLDivElement>(null);
  const selectedIdx = values.indexOf(selected);

  function step(delta: number) {
    const nextIdx = (selectedIdx + delta + values.length) % values.length;
    const next = values[nextIdx];
    if (next !== undefined) onSelect(next);
  }

  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      step(e.deltaY > 0 ? 1 : -1);
    }
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  });

  return (
    <div className="flex flex-col items-center border-r border-dashed border-[var(--border-default)] last:border-r-0 select-none">
      <span className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase tracking-[0.14em] pt-1.5 pb-0.5">{label}</span>
      <button
        type="button"
        onClick={() => step(-1)}
        className="flex items-center justify-center w-14 h-6 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-transparent border-0 cursor-pointer transition-colors duration-100"
        aria-label={`Decrease ${label}`}
      >
        <ChevronUp size={13} />
      </button>
      <div ref={colRef} className="flex flex-col items-center overflow-hidden w-14 h-[100px]">
        {values.map((v, i) => {
          const distance = Math.abs(i - selectedIdx);
          const isSelected = v === selected;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(v)}
              className={[
                'font-mono [font-feature-settings:"tnum"_1] border-0 bg-transparent cursor-pointer w-full text-center transition-all duration-[100ms]',
                isSelected
                  ? 'text-[var(--text-primary)] text-[26px] font-medium py-1 tracking-[-0.02em]'
                  : distance === 1
                  ? 'text-[var(--text-tertiary)] text-[13px] py-1.5'
                  : 'text-[var(--text-disabled)] text-[11px] py-1',
              ].join(' ')}
            >
              {String(v).padStart(2, '0')}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        className="flex items-center justify-center w-14 h-6 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-transparent border-0 cursor-pointer transition-colors duration-100"
        aria-label={`Increase ${label}`}
      >
        <ChevronDown size={13} />
      </button>
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
const SECONDS = [0, 15, 30, 45];

export function TimeDrum({ value = { hours: 8, minutes: 30, seconds: 15 }, onChange, showSeconds = true, className = '' }: TimeDrumProps) {
  return (
    <div className={`bg-[var(--surface-raised)] border border-[var(--text-primary)] inline-flex items-stretch p-1.5 gap-0 ${className}`}>
      <DrumColumn
        values={HOURS}
        selected={value.hours}
        onSelect={(hours) => onChange?.({ ...value, hours })}
        label="hh"
      />
      <DrumColumn
        values={MINUTES}
        selected={value.minutes}
        onSelect={(minutes) => onChange?.({ ...value, minutes })}
        label="mm"
      />
      {showSeconds && (
        <DrumColumn
          values={SECONDS}
          selected={value.seconds ?? 0}
          onSelect={(seconds) => onChange?.({ ...value, seconds })}
          label="ss"
        />
      )}
    </div>
  );
}

/* ============================================================
   ClockFace — analog clock for appointment time.
   ============================================================ */

export interface ClockFaceProps {
  readonly hours: number;
  readonly minutes: number;
  readonly label?: string;
  readonly size?: number;
}

export function ClockFace({ hours, minutes, label, size = 200 }: ClockFaceProps) {
  const r = size / 2;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6;

  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  const majorTicks = [0, 90, 180, 270];

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: r + radius * Math.cos(rad),
      y: r + radius * Math.sin(rad),
    };
  }

  const hourPos = polarToXY(hourDeg, r * 0.52);
  const minutePos = polarToXY(minuteDeg, r * 0.72);

  const numPositions: Array<{ num: string; angleDeg: number }> = [
    { num: '12', angleDeg: 0 },
    { num: '3', angleDeg: 90 },
    { num: '6', angleDeg: 180 },
    { num: '9', angleDeg: 270 },
  ];

  return (
    <div className="flex flex-col items-center gap-2.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <circle cx={r} cy={r} r={r - 1} fill="var(--surface-raised)" stroke="var(--text-primary)" strokeWidth="1" />
        {ticks.map((deg) => {
          const outer = polarToXY(deg, r - 4);
          const isMajor = majorTicks.includes(deg);
          const inner = polarToXY(deg, r - (isMajor ? 14 : 10));
          return (
            <line
              key={deg}
              x1={outer.x} y1={outer.y}
              x2={inner.x} y2={inner.y}
              stroke={isMajor ? 'var(--text-primary)' : 'var(--text-tertiary)'}
              strokeWidth={isMajor ? 2 : 1}
            />
          );
        })}
        {numPositions.map(({ num, angleDeg }) => {
          const pos = polarToXY(angleDeg, r - 22);
          return (
            <text
              key={num}
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--font-mono)" fontSize="11"
              fill="var(--text-tertiary)"
            >
              {num}
            </text>
          );
        })}
        <line
          x1={r} y1={r}
          x2={hourPos.x} y2={hourPos.y}
          stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"
        />
        <line
          x1={r} y1={r}
          x2={minutePos.x} y2={minutePos.y}
          stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round"
        />
        <circle cx={r} cy={r} r="3" fill="var(--text-primary)" />
      </svg>
      {label != null && (
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] text-center" style={{ width: size }}>
          {label}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DOBInput — date of birth with live age calculation.
   ============================================================ */

export interface DOBInputProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly className?: string;
}

function computeAge(dobStr: string): number | null {
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

export function DOBInput({ value = '', onChange, className = '' }: DOBInputProps) {
  const age = computeAge(value);

  return (
    <div className={`grid gap-[22px] items-end p-[18px_22px] bg-[var(--surface-raised)] border border-[var(--text-primary)] max-w-[520px] ${className}`}
      style={{ gridTemplateColumns: '1fr auto' }}>
      <div>
        <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">
          Date of birth
        </div>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[28px] text-[var(--text-primary)] p-1 pb-1 pt-0 outline-none w-[220px] tracking-[-0.01em]"
        />
      </div>
      <div className="text-right">
        <div className="font-serif text-[38px] font-medium leading-none tracking-[-0.022em] text-[var(--text-primary)]">
          {age != null ? age : '—'}
        </div>
        <div className="font-serif italic text-[14px] text-[var(--text-tertiary)]">years</div>
      </div>
    </div>
  );
}

/* ============================================================
   RecurrenceBuilder — medication schedule as a sentence.
   The clinician reads the order back to themselves.
   ============================================================ */

const DOSE_UNIT_OPTIONS = ['mg', 'mL', 'units'] as const;
const INTERVAL_OPTIONS = ['hours', 'days', 'weeks'] as const;
const UNTIL_OPTIONS = ['discontinued', 'a date', 'after a number of doses'] as const;

const SHORTCUTS: Array<{ label: string; hours: number }> = [
  { label: 'Q8H', hours: 8 },
  { label: 'QID', hours: 6 },
  { label: 'TID', hours: 8 },
  { label: 'BID', hours: 12 },
  { label: 'QD', hours: 24 },
  { label: 'QHS', hours: 24 },
  { label: 'PRN', hours: 0 },
  { label: 'STAT × 1', hours: 0 },
];

function computeDoseTimes(startTime: string, intervalHours: number, count = 5): string[] {
  if (intervalHours === 0) return [];
  const [h, m] = startTime.split(':').map(Number);
  if (h == null || m == null || isNaN(h) || isNaN(m)) return [];
  const times: string[] = [];
  let totalMinutes = h * 60 + m;
  for (let i = 0; i < count; i++) {
    const day = Math.floor(totalMinutes / (24 * 60));
    const mins = totalMinutes % (24 * 60);
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    times.push(`${hh}:${mm}${day > 0 ? ` +${day}d` : ''}`);
    totalMinutes += intervalHours * 60;
  }
  return times;
}

export interface RecurrenceBuilderProps {
  readonly className?: string;
}

export function RecurrenceBuilder({ className = '' }: RecurrenceBuilderProps) {
  const [dose, setDose] = useState('500');
  const [doseUnit, setDoseUnit] = useState<string>('mg');
  const [interval, setInterval] = useState('8');
  const [intervalUnit, setIntervalUnit] = useState<string>('hours');
  const [startTime, setStartTime] = useState('08:00');
  const [until, setUntil] = useState<string>('discontinued');
  const [activeShortcut, setActiveShortcut] = useState<string>('Q8H');

  function applyShortcut(label: string, hours: number) {
    setActiveShortcut(label);
    if (hours > 0) {
      setInterval(String(hours));
      setIntervalUnit('hours');
    }
  }

  const doseTimes = computeDoseTimes(startTime, Number(interval));

  const sentenceInputClass = 'bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-mono [font-feature-settings:"tnum"_1] text-[22px] px-1 pb-1 pt-0 outline-none text-[var(--text-primary)] not-italic tracking-[0] text-center';
  const sentenceSelectClass = 'bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-ui italic font-medium text-[22px] px-1.5 pb-1 outline-none text-[var(--text-primary)] cursor-pointer';

  return (
    <div className={`bg-[var(--surface-raised)] border border-[var(--text-primary)] p-[22px_26px] ${className}`}>
      <div className="font-serif italic text-[22px] text-[var(--text-primary)] leading-[1.5] tracking-[-0.012em] flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>Give</span>
        <input
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          className={sentenceInputClass}
          style={{ width: 80 }}
        />
        <select
          value={doseUnit}
          onChange={(e) => setDoseUnit(e.target.value)}
          className={sentenceSelectClass}
        >
          {DOSE_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <span>every</span>
        <input
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className={sentenceInputClass}
          style={{ width: 40 }}
        />
        <select
          value={intervalUnit}
          onChange={(e) => setIntervalUnit(e.target.value)}
          className={sentenceSelectClass}
        >
          {INTERVAL_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <span>, starting at</span>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className={sentenceInputClass}
          style={{ width: 84 }}
        />
        <span>, until</span>
        <select
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          className={sentenceSelectClass}
        >
          {UNTIL_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <span>.</span>
      </div>

      <div className="mt-[18px] pt-[14px] border-t border-[var(--border-default)] flex flex-wrap gap-1.5 items-center">
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mr-2">Common</span>
        {SHORTCUTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => applyShortcut(s.label, s.hours)}
            className={[
              'h-[22px] px-2 border rounded-full font-mono text-[11px] cursor-pointer transition-colors duration-[100ms] bg-transparent',
              activeShortcut === s.label
                ? 'bg-[var(--text-primary)] text-[var(--neutral-0)] border-[var(--text-primary)]'
                : 'border-[var(--text-tertiary)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {doseTimes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1 items-center">
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mr-1.5">Computed</span>
          {doseTimes.map((t, i) => (
            <span
              key={i}
              className={[
                'inline-flex items-center gap-1 px-2 py-0.5 font-mono [font-feature-settings:"tnum"_1] text-[11px] tracking-[0]',
                i === 0
                  ? 'bg-[var(--text-primary)] text-[var(--neutral-0)] border border-[var(--text-primary)]'
                  : 'bg-[var(--records-50)] border border-[var(--records-200)] text-[var(--records-800)]',
              ].join(' ')}
            >
              {t}
            </span>
          ))}
          <span className="font-mono [font-feature-settings:'tnum'_1] text-[11px] text-[var(--text-tertiary)] px-2 py-0.5 bg-[var(--records-50)] border border-[var(--records-200)]">
            …
          </span>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DurationInput — length of stay / visit / infusion.
   Large mono digit with italic serif unit label.
   ============================================================ */

export interface DurationFieldProps {
  readonly label: string;
  readonly fields: ReadonlyArray<{
    readonly value: string;
    readonly onChange: (v: string) => void;
    readonly unit: string;
    readonly width?: number;
  }>;
  readonly className?: string;
}

export function DurationField({ label, fields, className = '' }: DurationFieldProps) {
  return (
    <div className={className}>
      <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        {fields.map((f, i) => (
          <span key={i} className="flex items-baseline gap-2">
            <input
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[28px] text-[var(--text-primary)] text-right outline-none"
              style={{ width: f.width ?? 60 }}
            />
            <span className="font-serif italic text-[18px] text-[var(--text-tertiary)]">{f.unit}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
