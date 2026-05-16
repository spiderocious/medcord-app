import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import {
  EMRBanner,
  EMRSidebar,
  EMREntry,
  ProblemList,
  MedsList,
  LabsList,
  ProgressNote,
  AuditMargin,
  EMRChart,
} from '@medcord/ui';

const SIDEBAR_SECTIONS = [
  {
    label: 'Record',
    tabs: [
      { ordinal: '01', label: 'Summary', count: '↑', active: true },
      { ordinal: '02', label: 'Vitals', count: '24h' },
      { ordinal: '03', label: 'Meds', count: '8' },
      { ordinal: '04', label: 'Labs', count: '12' },
      { ordinal: '05', label: 'Imaging', count: '3' },
      { ordinal: '06', label: 'Notes', count: '7' },
    ],
  },
  {
    label: 'Decisions',
    tabs: [
      { ordinal: '07', label: 'Orders', count: '5' },
      { ordinal: '08', label: 'Problems', count: '3' },
      { ordinal: '09', label: 'Allergies', count: '2', alert: true },
    ],
  },
  {
    label: 'History',
    tabs: [
      { ordinal: '10', label: 'Immunizations', count: '' },
      { ordinal: '11', label: 'Procedures', count: '' },
      { ordinal: '12', label: 'Documents', count: '14' },
      { ordinal: '13', label: 'Audit', count: '' },
    ],
  },
] as const;

const PROBLEMS = [
  { name: 'Essential hypertension', icd: 'I10', since: 'since Aug 2014', by: 'R. Patel MD' },
  { name: 'Hyperlipidemia', icd: 'E78.5', since: 'since Mar 2016', by: 'R. Patel MD' },
  { name: 'Type 2 diabetes mellitus, without complications', icd: 'E11.9', since: 'since Nov 2018', by: 'M. Khan MD' },
] as const;

const MEDS = [
  {
    name: 'Lisinopril',
    dose: '10 mg PO',
    sig: '1 tablet by mouth, once daily, in the morning',
    indication: 'for hypertension',
    whenLines: ['last 04/30 08:14', 'due 05/01 08:00'],
    held: false,
  },
  {
    name: 'Furosemide',
    dose: '40 mg IV',
    sig: 'stat × 1, push over 1 minute',
    indication: 'held — BP 96/52 at 08:00',
    whenLines: ['held 05/01 08:00', 'by A. Williams RN'],
    held: true,
  },
  {
    name: 'Atorvastatin',
    dose: '40 mg PO',
    sig: '1 tablet by mouth, at bedtime',
    indication: 'for hyperlipidemia · started today',
    whenLines: ['due 05/01 21:00'],
    held: false,
  },
] as const;

const AUDIT_EVENTS = [
  {
    time: '14:42',
    body: 'Critical lab posted — Troponin 2.10 ng/mL. Auto-page to attending.',
    flagged: true,
  },
  {
    time: '14:08',
    body: (
      <>
        <span style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}>R. Patel</span> signed progress note.
      </>
    ),
  },
  {
    time: '13:40',
    body: (
      <>
        <span style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}>A. Williams</span> charted vitals.
      </>
    ),
  },
  {
    time: '09:18',
    body: (
      <>
        <span style={{ color: 'var(--warning-icon)', fontFamily: 'inherit' }}>M. Khan</span> overrode penicillin
        allergy — ordered Cefepime.{' '}
        <em style={{ fontStyle: 'italic' }}>justification logged</em>.
      </>
    ),
  },
  {
    time: '06:38',
    body: 'LIS imported BMP, CBC, troponin.',
  },
] as const;

const WATCHING = [
  { name: 'R. Patel MD', role: 'attending', active: true },
  { name: 'A. Williams RN', role: 'bedside', active: true },
  { name: 'M. Khan MD', role: 'consult', active: false },
] as const;

const PROVENANCE = [
  { year: '2014', body: 'First registered at this hospital, August.' },
  { year: '2018', body: 'Penicillin allergy documented after surgical reaction. Confirmed twice.' },
  { year: '2024', body: 'Last admission, two days, congestive symptoms.' },
] as const;

const NOTE_BLOCKS = [
  {
    heading: 'Subjective',
    body: (
      <em>
        "Pressure is gone now. Walked the unit twice without symptoms. He'd like to know when he can go home."
      </em>
    ),
  },
  {
    heading: 'Objective',
    body: (
      <>
        Vital signs stable through morning rounds. Repeat troponin at six hours{' '}
        <em>still pending</em>. ECG unchanged from prior. Patient ambulates without chest pain or dyspnea.
      </>
    ),
  },
  {
    heading: 'Assessment',
    body: (
      <>
        NSTEMI{' '}
        <code
          className="font-mono text-[13px] px-[5px] py-[1px] rounded-[2px] tracking-[0]"
          style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
        >
          I21.4
        </code>
        , day 3, recovering. HEART score now 4 (down from 6). Glucose elevated likely from morning steroid; will recheck.
      </>
    ),
  },
  {
    heading: 'Plan',
    body: (
      <>
        Repeat troponin at 18:00. If negative, plan discharge home with cardiology follow-up in clinic 14 May.
        Continue dual antiplatelet therapy. Add atorvastatin 40 mg nightly. Spouse has been notified of plan.
      </>
    ),
  },
] as const;

export function EMRScreen() {
  const [activeTab, setActiveTab] = useState('Summary');
  const [acknowledged, setAcknowledged] = useState(false);

  const labs = [
    {
      name: (
        <>
          <strong>Troponin I</strong> — initial 0.04 →{' '}
          <span style={{ color: 'var(--danger-icon)', fontWeight: 600 }}>repeat critical</span>
        </>
      ),
      value: '2.10',
      unit: 'ng/mL',
      range: '0.00–0.04',
      flag: 'crit' as const,
    },
    { name: 'Hemoglobin', value: '10.1', unit: 'g/dL', range: '12.0–17.5', flag: 'l' as const },
    { name: 'Sodium', value: '138', unit: 'mEq/L', range: '135–145', flag: 'normal' as const },
    { name: 'Potassium', value: '5.4', unit: 'mEq/L', range: '3.5–5.0', flag: 'h' as const },
    { name: 'Creatinine', value: '0.9', unit: 'mg/dL', range: '0.6–1.3', flag: 'normal' as const },
    { name: 'Glucose · random', value: '312', unit: 'mg/dL', range: '70–140', flag: 'h' as const },
  ];

  return (
    <div>
      <Section
        title="The chart, open."
        description="A single-column paper chart — the binder idiom. Left tabs, running record centre, audit margin right."
      >
        <EMRChart
          banner={
            <EMRBanner
              initials="OA"
              name="Adebayo, Olumide"
              nickname="Olu"
              demo="64 years · Male · DOB 14 Mar 1962"
              ids='MRN <strong style="color:var(--text-primary);font-weight:500">10458291</strong> &nbsp; ENC <strong style="color:var(--text-primary);font-weight:500">2026-04-29-1184</strong> &nbsp; Day <strong style="color:var(--text-primary);font-weight:500">3</strong>'
              codeStamp="Full code"
              rightRows={[
                { label: 'Attending', value: 'Patel, R MD' },
                { label: 'Bed', value: '3-N · 312A' },
                { label: 'Insurance', value: 'BCBS · verified' },
              ]}
              allergyText="Penicillin causes anaphylaxis. Sulfa drugs cause rash."
            />
          }
          sidebar={
            <EMRSidebar
              sections={SIDEBAR_SECTIONS.map((s) => ({
                label: s.label,
                tabs: s.tabs.map((t) => ({ ...t })),
              }))}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          }
          record={
            <>
              <EMREntry
                title="Active problems"
                when="last addressed Apr 30 by R. Patel"
                first
              >
                <ProblemList problems={PROBLEMS.map((p) => ({ ...p }))} />
              </EMREntry>

              <EMREntry
                title="Current medications"
                when="3 of 8 shown · open Meds for full list"
              >
                <MedsList meds={MEDS.map((m) => ({ ...m }))} />
              </EMREntry>

              <EMREntry
                title={
                  <>
                    Labs{' '}
                    <span
                      className="font-serif italic font-normal text-[16px]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      — results from May 1, 14:42
                    </span>
                  </>
                }
                when="collected 06:14 · resulted 06:38"
              >
                <LabsList
                  labs={labs}
                  acknowledged={acknowledged}
                  onAcknowledge={() => setAcknowledged(true)}
                />
              </EMREntry>

              <EMREntry
                title={
                  <>
                    Progress note{' '}
                    <span
                      className="font-serif italic font-normal text-[16px]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      — Patel, R MD
                    </span>
                  </>
                }
                when="May 1, 14:08"
                signed
                last
              >
                <ProgressNote
                  blocks={NOTE_BLOCKS.map((b) => ({ ...b }))}
                  signedBy={
                    <>
                      Reema Patel, MD{' '}
                      <span
                        className="font-mono text-[11px] tracking-[0]"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        NPI 1093847562
                      </span>
                    </>
                  }
                  signedStamp="14:08 · NUR-3N-04"
                />
              </EMREntry>
            </>
          }
          margin={
            <AuditMargin
              events={AUDIT_EVENTS.map((e) => ({ ...e }))}
              watching={WATCHING.map((w) => ({ ...w }))}
              provenance={PROVENANCE.map((p) => ({ ...p }))}
            />
          }
        />
      </Section>
    </div>
  );
}
