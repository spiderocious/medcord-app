import { Section } from '@features/shell/parts/preview-canvas';
import { PatientBanner } from '@medcord/ui';
import { Plus, ClipboardCheck, ArrowLeftRight, LogOut } from '@icons';

export function BannersScreen() {
  return (
    <div>
      {/* A. Admitted · with allergy */}
      <Section
        title="Admitted, allergic to penicillin."
        description="The chart-header most clinicians see — full code, Fall + NPO flags, allergy band in arterial red."
      >
        <PatientBanner
          initials="OA"
          name="Adebayo, Olumide"
          nickname="Olu"
          age="64"
          sex="Male"
          dob="14 Mar 1962"
          languages="English · Yoruba"
          ids={[
            { label: 'MRN', value: '10458291' },
            { label: 'ENC', value: '2026-04-29-1184' },
            { label: 'Day', value: '3 of admission' },
          ]}
          attending="Patel, R MD"
          service="Cardiology · step-down"
          bed="3-N · 312A"
          insurance="BCBS · verified"
          codeStatus="full-code"
          flags={[
            { label: 'Fall', variant: 'fall' },
            { label: 'NPO', variant: 'npo' },
          ]}
          allergyVariant="allergy"
          allergyText="Penicillin causes anaphylaxis. Sulfa drugs cause rash."
          allergySrc="documented Apr 2018 · R. Patel MD"
          tabs={[
            { label: 'Summary', active: true },
            { label: 'Vitals' },
            { label: 'Meds' },
            { label: 'Labs' },
            { label: 'Imaging' },
            { label: 'Notes' },
            { label: 'Orders' },
            { label: 'Problems' },
          ]}
          actions={[
            { label: 'Note', variant: 'quiet', icon: <Plus size={13} /> },
            { label: 'Order', variant: 'quiet', icon: <ClipboardCheck size={13} /> },
            { label: 'Transfer', variant: 'quiet', icon: <ArrowLeftRight size={13} /> },
            { label: 'Discharge…', variant: 'danger' },
          ]}
          vitals={[
            {
              label: 'Heart rate', value: '76', unit: 'bpm', status: 'normal',
              spark: [{ x: 0, y: 8 }, { x: 12, y: 7 }, { x: 24, y: 9 }, { x: 36, y: 7 }, { x: 48, y: 8 }, { x: 60, y: 7 }, { x: 72, y: 8 }, { x: 80, y: 7 }],
            },
            {
              label: 'Blood pressure', value: '128/82', unit: 'mmHg', status: 'normal',
              spark: [{ x: 0, y: 6 }, { x: 12, y: 7 }, { x: 24, y: 5 }, { x: 36, y: 7 }, { x: 48, y: 6 }, { x: 60, y: 7 }, { x: 72, y: 5 }, { x: 80, y: 6 }],
            },
            {
              label: 'Resp rate', value: '16', unit: '/min', status: 'normal',
              spark: [{ x: 0, y: 8 }, { x: 14, y: 8 }, { x: 28, y: 7 }, { x: 42, y: 8 }, { x: 56, y: 8 }, { x: 70, y: 7 }, { x: 80, y: 8 }],
            },
            { label: 'SpO₂', value: '98', unit: '%', status: 'normal', meta: 'room air' },
            { label: 'Temperature', value: '98.6', unit: '°F', status: 'normal', meta: '37.0 °C · oral · 14:08' },
            { label: 'Pain', value: '2', unit: '/10', status: 'normal', meta: '↓ from 4 at 09:00' },
          ]}
        />
      </Section>

      {/* B. Critical · CCU · DNR */}
      <Section
        title="Critical · CCU · DNR."
        description="No known allergies. Code stamp inverts to black. SpO₂ is shouting in critical red; HR and BP trend upward in amber."
      >
        <PatientBanner
          initials="SH"
          avatarBg="#F2DCD8"
          avatarColor="#7F1D1D"
          avatarBorder="#E5BAB3"
          name="Hadi, Samira"
          age="38"
          sex="Female"
          dob="14 Feb 1988"
          languages="Arabic · English"
          ids={[
            { label: 'MRN', value: '10778123' },
            { label: 'ENC', value: '2026-05-01-2408' },
            { label: 'Trop ↑↑', value: '2.10 ng/mL · 14:42', variant: 'crit' },
          ]}
          attending="Patel, R MD"
          service="Cardiology · CCU"
          bed="CCU · 207A"
          rightRows={[{ label: 'Cath team', value: 'paged 14:43' }]}
          codeStatus="dnr-dni"
          flags={[
            { label: 'Droplet', variant: 'iso' },
            { label: 'Aspiration', variant: 'aspir' },
          ]}
          allergyVariant="no-known"
          allergySrc="last reviewed Apr 2026"
          tabs={[
            { label: 'Summary' },
            { label: 'Vitals', active: true },
            { label: 'Meds' },
            { label: 'Labs' },
            { label: 'Imaging' },
            { label: 'Notes' },
            { label: 'Orders' },
          ]}
          actions={[
            { label: 'Note', variant: 'quiet', icon: <Plus size={13} /> },
            { label: 'Page cardiology', variant: 'secondary' },
            { label: 'Open chart →', variant: 'primary' },
          ]}
          vitals={[
            {
              label: 'Heart rate', value: '112', unit: 'bpm', status: 'flagged',
              spark: [{ x: 0, y: 9 }, { x: 14, y: 8 }, { x: 28, y: 7 }, { x: 42, y: 5 }, { x: 56, y: 4 }, { x: 70, y: 4 }, { x: 80, y: 3 }],
              meta: '↑ from 98 at 13:00',
            },
            {
              label: 'Blood pressure', value: '158/96', unit: 'mmHg', status: 'flagged',
              spark: [{ x: 0, y: 7 }, { x: 14, y: 6 }, { x: 28, y: 5 }, { x: 42, y: 4 }, { x: 56, y: 3 }, { x: 70, y: 3 }, { x: 80, y: 2 }],
            },
            { label: 'Resp rate', value: '22', unit: '/min', status: 'normal', meta: 'within range, just' },
            { label: 'SpO₂', value: '91', unit: '%', status: 'critical', meta: '↓ on 2 L NC · alarm armed' },
            { label: 'Temperature', value: '98.7', unit: '°F', status: 'normal', meta: '14:42' },
            { label: 'Pain', value: '7', unit: '/10', status: 'flagged', meta: 'substernal · radiating L arm' },
          ]}
        />
      </Section>

      {/* C. Pediatric outpatient */}
      <Section
        title="Pediatric outpatient — well visit."
        description="Growth percentile replaces day-of-admission. Latex advisory in the allergy position — styled subdued, not red. Standard vitals for age."
      >
        <PatientBanner
          initials="EM"
          avatarBg="#E1E8DD"
          avatarColor="#2F4226"
          avatarBorder="#C4D2BC"
          name="Mensah, Esi"
          age="14 months"
          sex="Female"
          dob="2 Mar 2025"
          languages={'w/ parent: Abena Mensah · mobile'}
          ids={[
            { label: 'MRN', value: '10982314' },
            { label: 'VISIT', value: '2026-05-01-OP-0814' },
            { label: 'Wt', value: '22 lb · 75th %ile' },
            { label: 'Ht', value: '30 in · 60th %ile' },
          ]}
          rightRows={[
            { label: 'Provider', value: 'Khan, M MD · Peds' },
            { label: 'Visit type', value: '15-month well visit' },
            { label: 'Room', value: 'Clinic · 4' },
            { label: 'Insurance', value: 'BCBS · ped rider' },
          ]}
          codeStatus="full-code"
          allergyVariant="advisory"
          allergyText="Latex sensitivity · mild · use non-latex gloves"
          allergySrc="advisory only · no anaphylaxis"
          tabs={[
            { label: 'Summary', active: true },
            { label: 'Vitals' },
            { label: 'Immunizations' },
            { label: 'Growth' },
            { label: 'Notes' },
          ]}
          actions={[
            { label: 'Note', variant: 'quiet', icon: <Plus size={13} /> },
            { label: 'Print AVS', variant: 'secondary' },
            { label: 'Sign visit', variant: 'primary' },
          ]}
          vitals={[
            { label: 'Heart rate', value: '118', unit: 'bpm', status: 'normal', meta: 'normal for age' },
            { label: 'Resp rate', value: '28', unit: '/min', status: 'normal', meta: 'normal for age' },
            { label: 'Temperature', value: '98.4', unit: '°F', status: 'normal', meta: 'tympanic' },
            { label: 'Weight', value: '22', unit: 'lb', status: 'normal', meta: '75th percentile · ↑ from 60th at 12 mo' },
            { label: 'Height', value: '30', unit: 'in', status: 'normal', meta: '60th percentile' },
            { label: 'Head circ.', value: '18.0', unit: 'in', status: 'normal', meta: '50th percentile' },
          ]}
        />
      </Section>

      {/* Suppress unused icons — they're passed as JSX props above */}
      {false && <><LogOut /></>}
    </div>
  );
}
