import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import { Table, StatusPill, type TableDensity, type TableSortDir } from '@ui/table';

type PatientRow = {
  readonly id: string;
  readonly initials: string;
  readonly avatarBg?: string;
  readonly avatarColor?: string;
  readonly avatarBorder?: string;
  readonly name: string;
  readonly subName?: string;
  readonly mrn: string;
  readonly dob: string;
  readonly bed: string;
  readonly attending: string;
  readonly vitals?: string;
  readonly vitalsColor?: string;
  readonly statusVariant: 'ok' | 'warn' | 'crit' | 'default';
  readonly statusLabel: string;
  readonly spark?: string;
  readonly sparkColor?: string;
  readonly critical?: boolean;
  readonly alertText?: string;
} & Record<string, unknown>;

const PATIENTS: PatientRow[] = [
  {
    id: 'sh', initials: 'SH', avatarBg: '#F2DCD8', avatarColor: '#7F1D1D', avatarBorder: '#E5BAB3',
    name: 'Hadi, Samira', subName: 'Trop ↑↑ 2.10 ng/mL · cath team paged',
    mrn: '10778123', dob: '14 Feb 1988 · 38 F', bed: 'CCU · 207A', attending: 'Patel, R MD',
    vitals: '112 · 158/96 · 91%', vitalsColor: 'var(--danger-icon)',
    statusVariant: 'crit', statusLabel: 'STAT',
    spark: '0,9 14,8 28,7 42,5 56,4 70,4 80,3', sparkColor: 'var(--danger-icon)',
    critical: true,
  },
  {
    id: 'oa', initials: 'OA', name: 'Adebayo, Olumide', subName: '"Olu" · ENC-1184',
    mrn: '10458291', dob: '14 Mar 1962 · 64 M', bed: '3-N · 312A', attending: 'Patel, R MD',
    vitals: '76 · 128/82 · 98%',
    statusVariant: 'ok', statusLabel: 'In room',
    spark: '0,8 14,7 28,9 42,7 56,8 70,7 80,8', sparkColor: '#8C8479',
  },
  {
    id: 'cw', initials: 'CW', avatarBg: '#E1E8DD', avatarColor: '#2F4226', avatarBorder: '#C4D2BC',
    name: 'Chen, Wei-Lin', subName: 'ENC-1163',
    mrn: '10293874', dob: '02 Nov 1985 · 40 F', bed: '3-N · 312B', attending: 'Patel, R MD',
    vitals: '88 · 122/78 · 99%',
    statusVariant: 'warn', statusLabel: 'Awaiting labs',
    spark: '0,9 14,8 28,9 42,7 56,8 70,8 80,7', sparkColor: '#8C8479',
  },
  {
    id: 'dm', initials: 'DM', avatarBg: '#E1E8DD', avatarColor: '#2F4226', avatarBorder: '#C4D2BC',
    name: 'Diallo, Mariama', subName: 'ENC-1165',
    mrn: '10883204', dob: '23 Jul 1971 · 54 F', bed: '3-N · 314A', attending: 'Okafor, C MD',
    vitals: '72 · 118/76 · 98%',
    statusVariant: 'ok', statusLabel: 'Admitted',
    spark: '0,8 14,8 28,7 42,8 56,8 70,8 80,7', sparkColor: '#8C8479',
  },
  {
    id: 'pj', initials: 'PJ', avatarBg: '#E1E8DD', avatarColor: '#2F4226', avatarBorder: '#C4D2BC',
    name: 'Park, Jiwoo', subName: 'ENC-1170',
    mrn: '10128403', dob: '09 Sep 1954 · 71 M', bed: '3-N · 316B', attending: 'Okafor, C MD',
    vitals: '68 · 124/80 · 97%',
    statusVariant: 'ok', statusLabel: 'In room',
    spark: '0,8 14,7 28,8 42,7 56,8 70,7 80,8', sparkColor: '#8C8479',
  },
];

function PatientCell({ row }: { readonly row: PatientRow }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center font-ui font-semibold text-[10px] flex-shrink-0"
        style={{
          background: row.avatarBg ?? '#ECE3D6',
          color: row.avatarColor ?? '#5C4B30',
          border: `1px solid ${row.avatarBorder ?? '#D4C4A6'}`,
        }}
      >
        {row.initials}
      </span>
      <div>
        <div className="font-ui text-[14px] font-medium text-[var(--text-primary)]">{row.name}</div>
        {row.subName !== null && (
          <div className={['font-mono text-[10px] tracking-[0] mt-0.5', row.critical === true ? 'text-[var(--danger-icon)]' : 'text-[var(--text-tertiary)]'].join(' ')}>
            {row.subName}
          </div>
        )}
      </div>
    </div>
  );
}

function SparkCell({ points, color = '#8C8479' }: { readonly points: string; readonly color?: string }) {
  return (
    <svg width="80" height="14" viewBox="0 0 80 14" preserveAspectRatio="none" className="w-20 h-3.5">
      <polyline points={points} stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function TablesScreen() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['sh', 'oa', 'cw']);
  const [density, setDensity] = useState<TableDensity>('regular');
  const [sortDir, setSortDir] = useState<TableSortDir>('asc');
  const [activeFilter, setActiveFilter] = useState('all');
  function handleSort() {
    setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
  }

  const columns = [
    {
      key: 'name', header: 'Patient', sortable: true,
      render: (row: PatientRow) => <PatientCell row={row} />,
    },
    { key: 'mrn', header: 'MRN', mono: true },
    { key: 'dob', header: 'DOB · age' },
    { key: 'bed', header: 'Bed' },
    { key: 'attending', header: 'Attending' },
    {
      key: 'vitals', header: 'Last vitals', mono: true,
      render: (row: PatientRow) => row.vitals !== null ? (
        <span style={row.vitalsColor !== null ? { color: row.vitalsColor } : {}}>{row.vitals}</span>
      ) : null,
    },
    {
      key: 'spark', header: 'Trend',
      render: (row: PatientRow) => row.spark !== null ? <SparkCell points={row.spark} color={row.sparkColor} /> : null,
    },
    {
      key: 'status', header: 'Status',
      render: (row: PatientRow) => <StatusPill label={row.statusLabel} variant={row.statusVariant} />,
    },
  ];

  const simpleColumns = [
    {
      key: 'name', header: 'Patient', sortable: true,
      render: (row: PatientRow) => <PatientCell row={row} />,
    },
    { key: 'mrn', header: 'MRN', mono: true },
    { key: 'bed', header: 'Bed' },
    { key: 'attending', header: 'Attending' },
    {
      key: 'status', header: 'Status',
      render: (row: PatientRow) => <StatusPill label={row.statusLabel} variant={row.statusVariant} />,
    },
  ];

  return (
    <div>
      {/* The worklist — with selection */}
      <Section
        title="The patient worklist."
        description="Three rows are selected; the bulk-action bar is in. Sort by patient name ascending."
      >
        <Table
          columns={columns}
          rows={PATIENTS}
          totalCount={42}
          density={density}
          onDensityChange={setDensity}
          sortKey="name"
          sortDir={sortDir}
          onSort={handleSort}
          selectable
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          bulkActions={[
            { label: 'Assign attending', onClick: () => {} },
            { label: 'Add tag', onClick: () => {} },
            { label: 'Export CSV', onClick: () => {} },
            { label: 'Discharge × 3', variant: 'danger', onClick: () => {} },
          ]}
          filterChips={[
            { label: 'All', key: 'all' },
            { label: 'Admitted', key: 'admitted' },
            { label: 'Awaiting labs', key: 'labs' },
            { label: 'Awaiting DC', key: 'dc' },
            { label: 'STAT only', key: 'stat', variant: 'crit' },
          ]}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          groupLabel="3-North · step-down · 3 more"
          groupAfterIndex={3}
          expandedRow={(row) => {
            const p = row as PatientRow;
            return (
              <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-1.5">MRN</div>
                  <div className="font-mono text-[13px] text-[var(--text-primary)] tracking-[0]">{p.mrn}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-1.5">Location</div>
                  <div className="font-mono text-[13px] text-[var(--text-primary)] tracking-[0]">{p.bed}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-1.5">Attending</div>
                  <div className="font-serif text-[13px] text-[var(--text-primary)]">{p.attending}</div>
                </div>
              </div>
            );
          }}
          page={1}
          pageCount={3}
        />
      </Section>

      {/* Density showcase */}
      <Section
        title="Density — same row, three readings."
        description="Compact for the night-shift worklist; regular for the day chart; comfy for review."
      >
        <div className="flex flex-col gap-[18px]">
          {(['compact', 'regular', 'comfy'] as TableDensity[]).map((d) => (
            <div key={d}>
              <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-1.5">
                {d} · {d === 'compact' ? '32 px row' : d === 'regular' ? '44 px' : '56 px'}
              </div>
              <Table
                columns={simpleColumns}
                rows={PATIENTS.slice(0, 2)}
                density={d}
                onDensityChange={() => {}}
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
