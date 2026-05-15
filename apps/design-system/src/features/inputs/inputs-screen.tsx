import { useState } from 'react';
import { LineField, LineSelect, LineTextarea, BlockInput, SearchInput, UnitToggle } from '@ui/input';
import { Section } from '@features/shell/parts/preview-canvas';

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'intersex', label: 'Intersex' },
  { value: 'not-say', label: 'Prefer not to say' },
] as const;

function VitalsBlock() {
  const [hr, setHr] = useState('76');
  const [bpSys, setBpSys] = useState('128');
  const [bpDia, setBpDia] = useState('82');
  const [rr, setRr] = useState('16');
  const [spo2, setSpo2] = useState('98');
  const [temp, setTemp] = useState('98.6');
  const [tempUnit, setTempUnit] = useState('°F');

  return (
    <div className="border border-[var(--text-primary)] bg-[var(--surface-raised)] grid"
      style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
      {/* Heart rate */}
      <div className="p-[16px_20px] border-r border-[var(--border-subtle)] flex flex-col gap-1.5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Heart rate</div>
        <div className="flex items-baseline gap-1.5">
          <input
            value={hr}
            onChange={(e) => setHr(e.target.value)}
            inputMode="numeric"
            className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-tertiary)] focus:border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[28px] font-medium tracking-[-0.02em] text-[var(--text-primary)] outline-none w-[70px] pb-[2px] transition-colors"
          />
          <span className="font-ui text-[11px] font-medium tracking-[0.02em] text-[var(--text-tertiary)]">bpm</span>
        </div>
        <div className="font-mono text-[10px] text-[var(--text-tertiary)]">range 60–100</div>
      </div>

      {/* Blood pressure (spans 2) */}
      <div className="p-[16px_20px] border-r border-[var(--border-subtle)] flex flex-col gap-1.5 col-span-2">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Blood pressure</div>
        <div className="flex items-baseline gap-1.5">
          <input
            value={bpSys}
            onChange={(e) => setBpSys(e.target.value)}
            inputMode="numeric"
            className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-tertiary)] focus:border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[28px] font-medium tracking-[-0.02em] text-[var(--text-primary)] outline-none w-[56px] pb-[2px] text-right transition-colors"
          />
          <span className="font-mono text-[24px] text-[var(--text-tertiary)]">/</span>
          <input
            value={bpDia}
            onChange={(e) => setBpDia(e.target.value)}
            inputMode="numeric"
            className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-tertiary)] focus:border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[28px] font-medium tracking-[-0.02em] text-[var(--text-primary)] outline-none w-[56px] pb-[2px] transition-colors"
          />
          <span className="font-ui text-[11px] font-medium tracking-[0.02em] text-[var(--text-tertiary)]">mmHg</span>
        </div>
        <div className="font-mono text-[10px] text-[var(--text-tertiary)]">last reading 124/80 at 09:00</div>
      </div>

      {/* Resp rate */}
      <div className="p-[16px_20px] border-r border-[var(--border-subtle)] flex flex-col gap-1.5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Resp rate</div>
        <div className="flex items-baseline gap-1.5">
          <input
            value={rr}
            onChange={(e) => setRr(e.target.value)}
            inputMode="numeric"
            className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-tertiary)] focus:border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[28px] font-medium tracking-[-0.02em] text-[var(--text-primary)] outline-none w-[70px] pb-[2px] transition-colors"
          />
          <span className="font-ui text-[11px] font-medium tracking-[0.02em] text-[var(--text-tertiary)]">/min</span>
        </div>
        <div className="font-mono text-[10px] text-[var(--text-tertiary)]">range 12–20</div>
      </div>

      {/* SpO2 */}
      <div className="p-[16px_20px] border-r border-[var(--border-subtle)] flex flex-col gap-1.5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">SpO₂</div>
        <div className="flex items-baseline gap-1.5">
          <input
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            inputMode="numeric"
            className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-tertiary)] focus:border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[28px] font-medium tracking-[-0.02em] text-[var(--text-primary)] outline-none w-[70px] pb-[2px] transition-colors"
          />
          <span className="font-ui text-[11px] font-medium tracking-[0.02em] text-[var(--text-tertiary)]">%</span>
        </div>
        <div className="font-mono text-[10px] text-[var(--text-tertiary)]">on room air</div>
      </div>

      {/* Temperature */}
      <div className="p-[16px_20px] flex flex-col gap-1.5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Temperature</div>
        <div className="flex items-baseline gap-1.5">
          <input
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            inputMode="decimal"
            className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-tertiary)] focus:border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[28px] font-medium tracking-[-0.02em] text-[var(--text-primary)] outline-none w-[70px] pb-[2px] transition-colors"
          />
          <UnitToggle options={['°F', '°C']} value={tempUnit} onChange={setTempUnit} />
        </div>
        <div className="font-mono text-[10px] text-[var(--text-tertiary)]">37.0 °C · oral</div>
      </div>
    </div>
  );
}

function DosageComposer() {
  const [amount, setAmount] = useState('500');

  return (
    <div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-1.5">
        Order — Amoxicillin 500 mg PO TID
      </div>
      <div className="flex items-baseline gap-3.5 py-3.5 border-b border-[var(--text-primary)]">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-mono [font-feature-settings:'tnum'_1] text-[36px] font-medium tracking-[-0.02em] text-[var(--text-primary)] outline-none w-[110px] text-right pb-1 px-1"
        />
        <select className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-mono text-[15px] text-[var(--text-primary)] outline-none cursor-pointer pb-1 px-1">
          <option>mg</option><option>mcg</option><option>g</option><option>mL</option>
        </select>
        <span className="font-ui italic text-[16px] text-[var(--text-tertiary)]">by</span>
        <select className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-mono text-[15px] text-[var(--text-primary)] outline-none cursor-pointer pb-1 px-1">
          <option>mouth</option><option>IV</option><option>IM</option><option>SC</option>
        </select>
        <span className="font-ui italic text-[16px] text-[var(--text-tertiary)]">every</span>
        <select className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-mono text-[15px] text-[var(--text-primary)] outline-none cursor-pointer pb-1 px-1">
          <option>8 hours</option><option>6 hours</option><option>12 hours</option><option>24 hours</option>
        </select>
        <span className="font-ui italic text-[16px] text-[var(--text-tertiary)]">×</span>
        <select className="bg-transparent border-0 border-b-[1.5px] border-[var(--text-primary)] font-mono text-[15px] text-[var(--text-primary)] outline-none cursor-pointer pb-1 px-1">
          <option>7 days</option><option>10 days</option><option>14 days</option>
        </select>
      </div>
      <div className="flex gap-3.5 items-center mt-2 font-mono text-[11px] text-[var(--text-tertiary)]">
        <span>renal-adjusted dose: <span className="text-[var(--text-primary)]">500 mg</span></span>
        <span className="text-[var(--warning-fg)]">max 2,000 mg / day</span>
        <span>est. cost / day · $1.40</span>
      </div>
      <div className="mt-3 bg-[var(--danger-bg)] border border-[var(--danger-border)] border-l-4 border-l-[var(--danger-icon)] px-3.5 py-2.5 text-[var(--danger-fg)] flex items-center gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] bg-[var(--danger-icon)] text-white px-1.5 py-0.5 rounded-[1px] flex-shrink-0">
          ALLERGY
        </span>
        <span className="font-ui italic text-[14px] leading-[1.45]">
          The patient is allergic to penicillin (anaphylaxis). Amoxicillin is the same class. Override requires reason and is logged.
        </span>
      </div>
    </div>
  );
}

type IcdResult = {
  readonly code: string;
  readonly name: string;
  readonly meta?: string;
  readonly badge?: string;
  readonly badgeVariant?: 'ok' | 'warn';
};

const ICD_RESULTS: readonly IcdResult[] = [
  { code: 'I10', name: 'Essential (primary) hypertension', meta: 'most-used in your dept · billable', badge: 'Most used', badgeVariant: 'ok' },
  { code: 'I11.9', name: 'Hypertensive heart disease without heart failure', meta: 'billable · requires linked HF code if present', badge: 'Billable', badgeVariant: 'ok' },
  { code: 'I12.9', name: 'Hypertensive CKD with stage 1–4 CKD', meta: 'requires CKD stage code', badge: 'Pair w/ CKD', badgeVariant: 'warn' },
  { code: 'I13.10', name: 'Hypertensive heart and CKD without heart failure' },
  { code: 'O10.012', name: 'Pre-existing essential hypertension complicating pregnancy', meta: 'obstetric encounters only' },
];

function Icd10Search() {
  const [selected, setSelected] = useState('I10');
  const [query, setQuery] = useState('hypertension');

  return (
    <div className="border border-[var(--text-primary)] bg-[var(--surface-raised)]">
      <SearchInput
        prefix="ICD-10"
        hint="↑ ↓ to step · ↵ to add"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-0 border-b border-[var(--text-primary)]"
      />
      <div>
        {ICD_RESULTS.map((result) => (
          <button
            key={result.code}
            type="button"
            onClick={() => setSelected(result.code)}
            className={[
              'w-full text-left grid gap-3.5 px-[18px] py-3 border-b border-dashed border-[var(--border-subtle)] last:border-0',
              'hover:bg-[var(--surface-sunken)] transition-colors duration-[100ms]',
              selected === result.code
                ? 'bg-[var(--surface-raised)] border-l-2 border-l-[var(--text-primary)] !pl-4'
                : '',
            ].join(' ')}
            style={{ gridTemplateColumns: '80px 1fr auto', alignItems: 'baseline' }}
          >
            <span className="font-mono text-[13px] font-medium text-[var(--text-primary)]">{result.code}</span>
            <div>
              <div className="font-ui text-[15px] font-medium text-[var(--text-primary)] tracking-[-0.005em] leading-[1.25]">
                {result.name}
              </div>
              {result.meta != null && (
                <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">{result.meta}</div>
              )}
            </div>
            {result.badge != null && (
              <span className={[
                'font-mono text-[10px] font-semibold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[1px] border flex-shrink-0',
                result.badgeVariant === 'warn'
                  ? 'text-[var(--warning-fg)] bg-[var(--warning-bg)] border-[var(--warning-border)]'
                  : 'text-[var(--records-800)] bg-[var(--records-50)] border-[var(--records-200)]',
              ].join(' ')}>
                {result.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function InputsScreen() {
  return (
    <div>
      <Section
        title="Vitals — six readings, one block"
        description="Tab moves between fields. Values are large mono so a clinician scanning the row reads them at a glance."
      >
        <VitalsBlock />
      </Section>

      <Section
        title="Dosage — number, unit, route"
        description="A single composed line. The number reads big because misreading 50 vs 500 is the hazard."
      >
        <DosageComposer />
      </Section>

      <Section
        title="ICD-10 — search the chart-book"
        description="Code first in mono, name in sans, meta below. The selected row is marked with a left rule, not a fill."
      >
        <Icd10Search />
      </Section>

      <Section
        title="Structured — paired fields"
        description="Demographics and registration. Same line-field, same labels, used in pairs."
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <LineField label="Family name" defaultValue="Adebayo" />
          <LineField label="Given name" defaultValue="Olumide" />
          <LineField label="Date of birth" defaultValue="1962-03-14" mono
            help="= 64 years" />
          <LineSelect
            label="Sex assigned at birth"
            options={SEX_OPTIONS}
            defaultValue="male"
          />
          <LineField label="Mobile" defaultValue="+1 (312) 555-0148" mono />
          <LineField label="Email" defaultValue="m.adebayo@example.com" />
          <div className="col-span-2">
            <LineField label="Address" defaultValue="142 W Lakeside Dr · Chicago, IL 60615" />
          </div>
          <div className="col-span-2">
            <LineField label="Emergency contact" defaultValue="Funmi Adebayo · spouse · +1 (312) 555-0193" />
          </div>
        </div>
      </Section>

      <Section title="States" description="Default · focus · disabled · read-only · error · ok.">
        <div className="grid grid-cols-3 gap-6">
          <LineField label="Default" placeholder="Search MRN, name, DOB" help="searchable from anywhere with /" />
          <LineField label="Focus" defaultValue="Adebayo, O" autoFocus />
          <LineField label="Disabled" defaultValue="signed by R. Patel · cannot edit" disabled help="Cannot be edited" />
          <LineField label="Read-only" defaultValue="ICD-10 I10" readOnly help="signed records are read-only" />
          <LineField label="Error" defaultValue="abc" status="error" help="pulse must be numeric, between 30 and 220" />
          <LineField label="Verified" defaultValue="m.adebayo@example.com" status="ok" help="verified · primary contact" />
        </div>
      </Section>

      <Section title="Block inputs" description="Boxed variant — used when alignment with siblings is required (tables, filter bars).">
        <div className="grid grid-cols-3 gap-4">
          <BlockInput label="MRN" placeholder="Search patient…" prefix="🔍" />
          <BlockInput label="Amount" defaultValue="500" mono suffix="mg" />
          <BlockInput label="Error state" defaultValue="abc" status="error" help="Invalid value" />
        </div>
      </Section>

      <Section title="Textarea">
        <div className="max-w-md">
          <LineTextarea label="Clinical notes" placeholder="Enter notes here…" help="Free text — will be attached to the encounter" />
        </div>
      </Section>
    </div>
  );
}
