import { useState } from 'react';
import { Section, ComponentRow } from '@features/shell/parts/preview-canvas';
import {
  Checkbox,
  Radio,
  RadioGroup,
  PainScale,
  Switch,
  Chip,
  AllergyInput,
  ProviderPicker,
  BedPicker,
} from '@medcord/ui';
import type { AllergyChip, Provider, Bed } from '@medcord/ui';

/* ============================================================
   Discharge Checklist Scene
   ============================================================ */

const INITIAL_CHECKLIST = [
  { id: '1', label: 'Medications reconciled — 8 active', time: '14:08', done: true },
  { id: '2', label: 'Follow-up scheduled — Patel R, 14 May', time: '14:09', done: true },
  { id: '3', label: 'Discharge education — cardiac diet, activity', time: '14:18', done: true },
  { id: '4', label: 'Prescriptions sent — Walgreens, 142 Main', time: '14:24', done: true },
  { id: '5', label: 'Transportation home confirmed', time: '— pending', done: false },
  { id: '6', label: 'Home health referral, if needed', time: '— pending', done: false },
] as const;

function DischargeChecklist() {
  const [checked, setChecked] = useState<Set<string>>(
    new Set(INITIAL_CHECKLIST.filter((i) => i.done).map((i) => i.id))
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const doneCount = checked.size;

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] px-[22px] py-[18px] max-w-[480px]">
      <h3 className="m-0 mb-3 font-serif text-[18px] font-medium tracking-[-0.012em] flex items-baseline gap-2.5">
        Pre-discharge — Adebayo, O.
        <span className="font-mono text-[11px] text-[var(--text-tertiary)] font-normal ml-auto">
          {doneCount} of {INITIAL_CHECKLIST.length}
        </span>
      </h3>
      {INITIAL_CHECKLIST.map((item, i) => {
        const isDone = checked.has(item.id);
        const isLast = i === INITIAL_CHECKLIST.length - 1;
        return (
          <label
            key={item.id}
            className={[
              'flex items-center gap-2.5 py-[7px] cursor-pointer',
              !isLast ? 'border-b border-dashed border-[var(--border-default)]' : '',
            ].join(' ')}
          >
            <Checkbox
              checked={isDone}
              onChange={() => toggle(item.id)}
              className="flex-shrink-0"
            />
            <span className={`flex-1 text-[14px] ${isDone ? 'text-[var(--text-tertiary)] line-through decoration-[1px]' : 'text-[var(--text-primary)]'}`}>
              {item.label}
            </span>
            <span className="font-mono text-[12px] text-[var(--text-tertiary)] ml-auto flex-shrink-0">
              {item.time}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* ============================================================
   Switches scene
   ============================================================ */

function SwitchesScene() {
  const [autoPage, setAutoPage] = useState(true);
  const [tabular, setTabular] = useState(true);
  const [alarmTone, setAlarmTone] = useState(false);

  return (
    <div className="flex flex-col max-w-[480px]">
      <div className="py-2.5 border-b border-[var(--border-default)]">
        <Switch
          checked={autoPage}
          onChange={setAutoPage}
          label="Auto-page attending on critical lab"
          description="Sends a page if a value crosses the critical line."
        />
      </div>
      <div className="py-2.5 border-b border-[var(--border-default)]">
        <Switch
          checked={tabular}
          onChange={setTabular}
          label="Tabular numerals in tables"
          description="Aligns digits in lab and vital columns."
        />
      </div>
      <div className="py-2.5 border-b border-[var(--border-default)]">
        <Switch
          checked={alarmTone}
          onChange={setAlarmTone}
          label="Alarm tone — bedside"
          description="Plays an audible tone on alarms armed at this workstation."
        />
      </div>
      <div className="py-2.5 opacity-50">
        <Switch
          checked={false}
          disabled
          label="Beta — predictive deterioration alerts"
          description="Disabled by hospital administrator."
        />
      </div>
    </div>
  );
}

/* ============================================================
   Filter chips scene
   ============================================================ */

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'ed', label: 'In ED' },
  { value: 'labs', label: 'Awaiting labs' },
  { value: 'dc', label: 'Awaiting DC' },
  { value: 'discharged', label: 'Discharged' },
] as const;

function ChipsScene() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [allergies, setAllergies] = useState<AllergyChip[]>([
    { id: '1', label: 'Penicillin · anaphylaxis', severity: 'critical' },
    { id: '2', label: 'Sulfa drugs · rash', severity: 'critical' },
    { id: '3', label: 'Latex · contact dermatitis', severity: 'warning' },
  ]);
  const [activeChips, setActiveChips] = useState([
    { id: 'w', label: 'Ward · 3-North' },
    { id: 'a', label: 'Acuity · ESI 1–2' },
    { id: 'p', label: 'Attending · Patel R' },
  ]);

  function removeAllergy(id: string) {
    setAllergies((prev) => prev.filter((a) => a.id !== id));
  }

  function addAllergy(label: string) {
    setAllergies((prev) => [
      ...prev,
      { id: String(Date.now()), label, severity: 'critical' },
    ]);
  }

  function removeActiveChip(id: string) {
    setActiveChips((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="flex flex-col gap-6 max-w-[560px]">
      <div>
        <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2">
          Filter status
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              variant={activeFilter === opt.value ? 'active' : 'default'}
              onClick={() => setActiveFilter(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
          <Chip variant="critical">STAT only</Chip>
        </div>
      </div>

      <div>
        <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2">
          Allergies — multi-value input
        </div>
        <AllergyInput
          chips={allergies}
          onRemove={removeAllergy}
          onAdd={addAllergy}
        />
      </div>

      <div>
        <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2">
          Active filters — removable
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {activeChips.map((chip) => (
            <Chip
              key={chip.id}
              variant="active"
              onRemove={() => removeActiveChip(chip.id)}
            >
              {chip.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Provider Picker scene
   ============================================================ */

const PROVIDERS: Provider[] = [
  {
    id: 'rp',
    initials: 'RP',
    name: 'Patel, Reema MD — FACC',
    role: 'attending',
    meta: 'NPI 1093847562 · pager ×4187',
    status: 'on-shift',
    group: 'Cardiology — on this floor now',
  },
  {
    id: 'pa',
    initials: 'PA',
    name: 'Park, Aaron DO',
    role: 'cardiology fellow',
    meta: 'pager ×4203',
    status: 'on-shift',
    group: 'Cardiology — on this floor now',
  },
  {
    id: 'pd',
    initials: 'PD',
    name: 'Park, Daniel MD',
    role: 'hospitalist',
    status: 'off-shift',
    statusLabel: 'off shift · returns 19:00',
    group: 'Internal medicine',
  },
];

/* ============================================================
   Bed Picker scene
   ============================================================ */

const BEDS: Bed[] = [
  { id: '312a', room: '312', bed: 'A', status: 'occupied', patient: 'Adebayo, O' },
  { id: '312b', room: '312', bed: 'B', status: 'occupied', patient: 'Chen, W' },
  { id: '313a', room: '313', bed: 'A', status: 'available' },
  { id: '313b', room: '313', bed: 'B', status: 'cleaning' },
  { id: '314a', room: '314', bed: 'A', status: 'isolated', patient: 'Diallo, M' },
  { id: '314b', room: '314', bed: 'B', status: 'occupied', patient: 'Selected' },
  { id: '315a', room: '315', bed: 'A', status: 'offline' },
  { id: '315b', room: '315', bed: 'B', status: 'offline' },
  { id: '316a', room: '316', bed: 'A', status: 'available' },
  { id: '316b', room: '316', bed: 'B', status: 'occupied', patient: 'Park, J' },
  { id: '317a', room: '317', bed: 'A', status: 'isolated', patient: 'Reed, S' },
  { id: '317b', room: '317', bed: 'B', status: 'cleaning' },
];

/* ============================================================
   SelectionScreen
   ============================================================ */

export function SelectionScreen() {
  const [sex, setSex] = useState('male');
  const [pain, setPain] = useState('2');
  const [provider, setProvider] = useState('rp');
  const [bed, setBed] = useState('314b');

  return (
    <div>
      {/* Checkbox */}
      <Section
        title="Checkbox — discharge checklist."
        description="A drawn ink square with a hand-tick. Done items are struck through and quieted."
      >
        <div className="flex gap-16 items-start flex-wrap">
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-1">The tick</div>
            <Checkbox label="default" />
            <Checkbox label="checked" checked readOnly />
            <Checkbox label="indeterminate" indeterminate readOnly />
            <Checkbox label="disabled" disabled />
          </div>
          <DischargeChecklist />
        </div>
      </Section>

      {/* Radio */}
      <Section
        title="Radio — sex assigned at birth."
        description="A drawn ink circle with an ink dot. Mutually exclusive choices, four at most before they become a select."
      >
        <RadioGroup
          name="sex"
          value={sex}
          onChange={setSex}
          direction="row"
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'intersex', label: 'Intersex' },
            { value: 'prefer-not', label: 'Prefer not to say' },
          ]}
        />
        <div className="mt-6">
          <ComponentRow label="States">
            <Radio label="Unchecked" checked={false} readOnly />
            <Radio label="Checked" checked readOnly />
            <Radio label="Disabled" disabled />
          </ComponentRow>
        </div>
      </Section>

      {/* Pain scale */}
      <Section
        title="Wong–Baker — pain scale."
        description="Six radio cards, drawn faces in the serif. The selected card carries an ink rule under it instead of a fill."
      >
        <PainScale value={pain} onChange={setPain} />
        <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
          Currently selected: <span className="font-mono">{pain}</span>
        </p>
      </Section>

      {/* Switches */}
      <Section
        title="Switches — the only &ldquo;modern&rdquo; idiom."
        description="Tight, mono-grey when off, full ink when on. For binary preferences only — never for actions."
      >
        <SwitchesScene />
      </Section>

      {/* Chips */}
      <Section
        title="Chips — filters &amp; allergies."
        description="Two uses: filter chips on a list (toggle on/off) and content chips inside a multi-value field."
      >
        <ChipsScene />
      </Section>

      {/* Provider combobox */}
      <Section
        title="Combobox — provider picker."
        description="Same chart-book idiom from Inputs, but for people. Group by department; show on-shift status with a pulse."
      >
        <ProviderPicker
          providers={PROVIDERS}
          value={provider}
          onChange={setProvider}
          className="max-w-[600px]"
        />
      </Section>

      {/* Bed picker */}
      <Section
        title="Room &amp; bed picker — the wing as a small map."
        description="Same vocabulary as the Bed Board: typeset, not coloured. Selected bed inverts to ink-on-paper."
      >
        <BedPicker
          beds={BEDS}
          value={bed}
          onChange={setBed}
          columns={6}
        />
        <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
          Selected: <span className="font-mono">{bed}</span>
        </p>
      </Section>
    </div>
  );
}
