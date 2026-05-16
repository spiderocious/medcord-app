import { Section } from '@features/shell/parts/preview-canvas';
import {
  TelehealthRoom,
  PatientQueueRow,
  DictationNote,
} from '@medcord/ui';

export function TelehealthScreen() {
  return (
    <div>
      <Section
        title="Telehealth · video visit."
        description="Full video call room: stage tiles, live captions, controls, patient chart panel."
      >
        <TelehealthRoom
          call={{
            tiles: [
              {
                variant: 'patient',
                initials: 'OA',
                name: 'Adebayo, O',
                role: 'Patient · 64 M',
                network: { label: 'Excellent · 78 ms', bars: [4, 6, 8, 10] },
              },
              {
                variant: 'provider',
                initials: 'RP',
                name: 'Patel, R MD',
                role: 'Cardiology',
                showRec: true,
              },
            ],
            captions: {
              speaker: 'Patient',
              text: '“…the chest pressure started two hours ago, after I walked up the stairs at home. It felt like a weight, then it went away after I sat down.”',
            },
            duration: '14:32 / connected for 4 m 18 s',
          }}
          sidePanel={{
            name: 'Adebayo, Olumide',
            demo: 'MRN 10458291 · 64 M · DOB 14 Mar 1962',
            reasonForVisit: '“Two-week follow-up after NSTEMI admission. Reports occasional chest tightness with stairs.”',
            vitals: [
              { label: 'HR', value: '78' },
              { label: 'BP · home', value: '132/86' },
            ],
            medications: [
              'Lisinopril 10 mg PO QD',
              'Atorvastatin 40 mg PO QHS',
              'Aspirin 81 mg PO QD',
              'Metformin 500 mg PO BID',
              'Metoprolol 25 mg PO BID',
            ],
            lastAdmit: '29 Apr — 02 May. NSTEMI. Cath: 90% LAD lesion, stent placed. Discharged on dual antiplatelet therapy.',
          }}
        />
      </Section>

      <Section
        title="Patient queue + dictated note."
        description="The waiting queue with active pulse indicator and AI-assisted dictation note in progress."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)]">
            <div className="m-0 px-[18px] py-[14px] font-serif text-[18px] font-medium tracking-[-0.012em] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)] text-[var(--text-primary)]">
              Patient queue
            </div>
            <PatientQueueRow
              name="Adebayo, O."
              age="64 M"
              reason='"chest tightness with stairs"'
              isActive
            />
            <PatientQueueRow
              name="Chen, W."
              age="40 F"
              reason='"hypertension follow-up"'
              when="14:45 · in 12 m"
            />
            <PatientQueueRow
              name="Diallo, M."
              age="54 F"
              reason='"pre-op consult — needs interpreter"'
              when="15:00"
            />
            <PatientQueueRow
              name="Park, D."
              age="52 M"
              reason='"unrouted — no service tag"'
              when="needs assignment"
              needsAttention
            />
          </div>

          <DictationNote
            title="Dictated note · in progress"
            meta="auto-saved 14:32"
            paragraphs={[
              {
                label: 'HPI.',
                text: 'Mr. Adebayo is a 64-year-old man, two weeks post stent for NSTEMI, who reports occasional chest tightness with exertion. He describes this as <em>different from his prior pain</em>, less severe and resolving with rest. Denies dyspnea, diaphoresis, palpitations.',
              },
              {
                label: 'Plan.',
                text: 'Continue dual antiplatelet therapy. Stress test scheduled for next week. Reviewed warning signs and when to call. Patient is reassured.',
              },
            ]}
            aiChips={['Rewrite as SOAP', 'Suggest ICD-10']}
            aiDisclaimer="suggestions only — never auto-applied"
          />
        </div>
      </Section>
    </div>
  );
}
