import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import {
  DropZone,
  FileRow,
  DicomThumb,
  PinInput,
  StarRating,
  SignaturePad,
  SoapNote,
  MarkdownEditor,
  MarkdownViewer,
  BodyDiagram,
} from '@medcord/ui';
import type { BodyMarking, SoapSection } from '@medcord/ui';

const INITIAL_SOAP: SoapSection[] = [
  {
    key: 'S',
    label: 'Subjective',
    content: '"Crushing chest pressure × 30 min, sweating, nausea. Last meal at four in the morning." Pain seven of ten.',
  },
  {
    key: 'O',
    label: 'Objective',
    content: 'VS: BP 142/88 · HR 96 · RR 18 · SpO₂ 98% RA · T 98.6 °F. Cards: RRR, no m/r/g. Lungs CTA b/l. ECG: NSR, no acute ST changes. Initial troponin 0.04, repeat 14:42 = 2.10 ng/mL critical.',
  },
  {
    key: 'A',
    label: 'Assessment',
    content: 'NSTEMI I21.4. HEART score 6 (high risk).',
  },
  {
    key: 'P',
    label: 'Plan',
    content: 'Transfer to CCU 207A. ASA 325 mg PO × 1, given. Heparin gtt per protocol. Cardiology consult. Cath lab notified. NPO.',
  },
];

const DICOM_IMAGES = [
  { modality: 'CR', date: '04/30 · 14:22', label: 'CHEST PA', gradient: 'linear-gradient(135deg, #2A2520, #6E665B 60%, #A39A8A)' },
  { modality: 'MRI', date: '04/28 · 09:14', label: 'BRAIN T1', gradient: 'linear-gradient(180deg, #181613, #3C3833 50%, #6E665B)' },
  { modality: 'CT', date: '04/29 · 11:42', label: 'ABD/PEL', gradient: 'radial-gradient(ellipse at center, #A39A8A, #3C3833 70%, #181613)' },
  { modality: 'US', date: '04/30 · 16:30', label: 'ECHO', gradient: 'linear-gradient(45deg, #3C3833, #6E665B, #A39A8A)' },
] as const;

const INITIAL_MARKINGS: BodyMarking[] = [
  // Anterior markings
  { id: 'ant-chest', view: 'anterior', cx: 50, cy: 65, rx: 14, ry: 10, label: 'PAIN', color: 'danger' },
  { id: 'ant-shoulder-r', view: 'anterior', cx: 30, cy: 44, rx: 7, ry: 6, label: 'TENDER', color: 'warning' },
  { id: 'ant-elbow-l', view: 'anterior', cx: 85, cy: 80, rx: 6, ry: 5, label: 'BRUISE', color: 'info' },
  { id: 'ant-knee-r', view: 'anterior', cx: 38, cy: 170, rx: 7, ry: 6, label: 'SWELL', color: 'warning' },
  { id: 'ant-abdomen', view: 'anterior', cx: 50, cy: 108, rx: 10, ry: 8, label: 'GUARD', color: 'danger' },
  { id: 'ant-head', view: 'anterior', cx: 50, cy: 15, rx: 8, ry: 6, label: 'LACR', color: 'danger' },
  // Posterior markings
  { id: 'post-lumbar', view: 'posterior', cx: 50, cy: 95, rx: 12, ry: 10, label: 'SPASM', color: 'warning' },
  { id: 'post-scapula-r', view: 'posterior', cx: 38, cy: 58, rx: 8, ry: 7, label: 'PAIN', color: 'danger' },
  { id: 'post-sacrum', view: 'posterior', cx: 50, cy: 118, rx: 9, ry: 7, label: 'PRESS', color: 'info' },
  { id: 'post-calf', view: 'posterior', cx: 50, cy: 185, rx: 8, ry: 6, label: 'DVT?', color: 'danger' },
];

export function SpecializedScreen() {
  const [pin, setPin] = useState('391');
  const [rating, setRating] = useState(4);
  const [markdown, setMarkdown] = useState(`**HPI:** 64 M with hx HTN, hyperlipidemia presents with substernal chest pressure × 2 h, radiating L arm. Denies SOB, diaphoresis. *Pain 7/10.*\n\n**PMH:**\n— Essential hypertension \`I10\`\n— Hyperlipidemia \`E78.5\`\n— Type 2 diabetes \`E11.9\``);
  const [soap, setSoap] = useState<SoapSection[]>(INITIAL_SOAP);
  const [bodyMarkings, setBodyMarkings] = useState<BodyMarking[]>(INITIAL_MARKINGS);

  function handleBodyMark(view: 'anterior' | 'posterior', cx: number, cy: number) {
    setBodyMarkings(prev => [...prev, { id: `${view}-${Date.now()}`, view, cx, cy, rx: 8, ry: 6, label: 'NEW', color: 'info' }]);
  }

  function handleSoapChange(key: string, content: string) {
    setSoap(prev => prev.map(s => s.key === key ? { ...s, content } : s));
  }

  return (
    <div>
      {/* Drop Zone */}
      <Section
        title="Drop zone — and the file row."
        description="A dashed edge with a serif inscription. Once files are dropped, the rows below carry them like stamped paperclips."
      >
        <div className="grid gap-[18px] mb-6 grid-cols-1 sm:grid-cols-2">
          <DropZone sublabel="PDF · JPEG · PNG · DICOM · max 50 MB" />
          <DropZone state="hover" label="Release to upload three files." sublabel="labs.pdf · echo.dcm · consent.pdf" />
          <DropZone state="ok" label="Three files uploaded." sublabel="labs.pdf · echo.dcm · consent.pdf" />
          <DropZone state="error" label="Upload failed." sublabel="scan.pdf exceeds 50 MB · split or compress and retry" />
        </div>

        <div className="flex flex-col">
          <FileRow name="echo_2026-04-30.pdf" status="uploading" progress={62} size="2.3 MB" />
          <FileRow name="Lab_BMP_2026-04-30.pdf" status="ok" statusLabel="uploaded" size="218 KB · 14:22" />
          <FileRow name="consent.pdf" status="error" statusLabel="network error" size="retry" />
        </div>
      </Section>

      {/* DICOM */}
      <Section
        title="DICOM — the radiology thumb."
        description="Greyscale stripes, mono badge, modality and timestamp typeset like a film header. Click to open the viewer."
      >
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {DICOM_IMAGES.map((d) => (
            <DicomThumb
              key={d.modality}
              modality={d.modality}
              date={d.date}
              label={d.label}
              gradient={d.gradient}
            />
          ))}
        </div>
      </Section>

      {/* Insurance / ID */}
      <Section
        title="Insurance &amp; ID — paired front &amp; back."
        description="Two slots side-by-side. The front carries colour because it is a real card; the back is mostly text and nothing else."
      >
        <div className="grid gap-[22px] grid-cols-1 sm:grid-cols-2">
          {/* Insurance card */}
          <div className="border border-[var(--text-primary)] bg-[var(--surface-raised)]">
            <div className="flex items-baseline gap-2 px-4 py-3 border-b border-[var(--text-primary)]">
              <span className="font-serif text-[16px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">Insurance — BlueCross BlueShield</span>
              <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">verified</span>
            </div>
            <div className="grid gap-px bg-[var(--text-primary)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="p-3 relative flex flex-col gap-1" style={{ aspectRatio: '1.6', background: 'linear-gradient(135deg,#1F2D4A,#395282)' }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[rgba(244,239,230,0.55)]">Front · Member</span>
                <div className="font-serif text-[16px] font-medium text-[var(--neutral-0)]">ADEBAYO O</div>
                <div className="font-mono text-[11px] text-[var(--neutral-0)] tracking-[0]">XYL923847562</div>
                <div className="font-mono text-[11px] text-[var(--neutral-0)] tracking-[0] mt-auto">Group · 1184-CORP</div>
                <span className="absolute top-2 right-2 font-serif text-[16px] font-bold text-[var(--neutral-0)]">BCBS</span>
              </div>
              <div className="p-3 bg-[var(--surface-raised)] flex flex-col gap-1" style={{ aspectRatio: '1.6' }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Back</span>
                <div className="font-serif italic text-[13px] text-[var(--text-secondary)] leading-[1.4]">Customer service<br />1-800-555-0148</div>
                <div className="font-mono text-[11px] text-[var(--text-secondary)] tracking-[0] mt-auto">RxBIN 003858 · PCN A4</div>
              </div>
            </div>
          </div>

          {/* ID card */}
          <div className="border border-[var(--text-primary)] bg-[var(--surface-raised)]">
            <div className="flex items-baseline gap-2 px-4 py-3 border-b border-[var(--text-primary)]">
              <span className="font-serif text-[16px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">ID — Driver's license</span>
              <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">on file</span>
            </div>
            <div className="grid gap-px bg-[var(--text-primary)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="p-3 bg-[var(--surface-raised)] flex flex-col gap-1" style={{ aspectRatio: '1.6' }}>
                <div className="flex gap-2.5">
                  <div className="w-[50px] h-[60px] bg-[var(--surface-sunken)] border border-dashed border-[var(--text-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] font-mono text-[9px] flex-shrink-0">
                    photo
                  </div>
                  <div>
                    <div className="font-serif text-[16px] font-medium text-[var(--text-primary)]">ADEBAYO, OLUMIDE</div>
                    <div className="font-mono text-[11px] text-[var(--text-secondary)] mt-1 tracking-[0]">DL · D9183-XXXX</div>
                    <div className="font-mono text-[11px] text-[var(--text-secondary)] tracking-[0]">DOB 03/14/1962</div>
                    <div className="font-mono text-[11px] text-[var(--text-secondary)] tracking-[0]">EXP 03/14/2030</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center border border-dashed border-[var(--text-tertiary)] font-serif italic text-[14px] text-[var(--text-tertiary)] bg-[var(--surface-base)]" style={{ aspectRatio: '1.6' }}>
                + Add back of license
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* PIN */}
      <Section
        title="PIN — badge re-authentication."
        description="Six small boxes; the next-to-fill is underlined like a fountain-pen field. The workstation auto-locks for HIPAA."
      >
        <PinInput
          length={6}
          value={pin}
          onChange={setPin}
          label="Re-enter your badge PIN to continue"
          note="Workstation auto-locks after five minutes of inactivity. This is a HIPAA requirement, not a setting."
        />
      </Section>

      {/* Rating */}
      <Section
        title="Rating — patient satisfaction."
        description="Five stars drawn in ink. Half-stars are not allowed; if a patient is between two, ask which one."
      >
        <div className="flex items-center gap-4 p-[18px_22px] bg-[var(--surface-raised)] border border-[var(--text-primary)] max-w-[520px]">
          <StarRating
            value={rating}
            onChange={setRating}
            score={4.0}
            scoreLabel="Press Ganey · n = 128, last 30 d"
          />
        </div>
      </Section>

      {/* Signatures */}
      <Section
        title="Signatures — patient &amp; witness."
        description="A paper-tape with ruled lines. The signature is drawn over the rules, not in a box. Witness signature uses a quieter paper."
      >
        <div className="grid gap-[22px] grid-cols-1 sm:grid-cols-2">
          <SignaturePad
            label="Patient signature"
            meta="Adebayo, O. · 14:08"
            signaturePath="M 8 36 C 18 22, 30 50, 42 32 S 70 18, 86 38 S 122 16, 142 28 S 184 20, 210 34"
          />
          <SignaturePad
            label="Witness signature"
            meta="A. Williams RN · 14:09"
            signaturePath="M 6 30 Q 30 12, 56 28 T 110 30 T 168 24 T 220 32"
            strokeColor="var(--text-secondary)"
            quiet
          />
        </div>
      </Section>

      {/* Body Diagram */}
      <Section
        title="Body diagram — front &amp; back."
        description="Named landmarks on every major region — head, crown, temples, ears, jaw, shoulders, elbows, wrists, chest, abdomen, hips, knees, ankles, and spine landmarks on the posterior. Click anywhere to add a new marking at that coordinate."
      >
        <BodyDiagram
          markings={bodyMarkings}
          onMark={handleBodyMark}
          onMarkingsChange={setBodyMarkings}
          allowFullView
        />
      </Section>

      {/* SOAP */}
      <Section
        title="SOAP — note as a structured input."
        description="Four labelled blocks, each with the letter as a serif tablet. Type into the body; the letters are the structure."
      >
        <SoapNote sections={soap} onSectionChange={handleSoapChange} />
      </Section>

      {/* Markdown editor */}
      <Section
        title="Markdown editor — clinical narration."
        description="The body is set in serif, large, like a doctor's letter. The toolbar is mono, hairline. Toolbar buttons apply real markdown syntax. Keyboard shortcuts: ⌘B bold, ⌘I italic, ⌘K link."
      >
        <MarkdownEditor
          value={markdown}
          onChange={setMarkdown}
          savedAt="14:08"
        />
      </Section>

      {/* Markdown viewer */}
      <Section
        title="Markdown viewer — rendered output."
        description="Pass any markdown string as children. Headings use serif, code uses mono, blockquotes indent with a hairline left rule."
      >
        <div className="border border-[var(--text-primary)] bg-[var(--surface-raised)] p-6">
          <MarkdownViewer>
            {`## Discharge Summary\n\n**Patient:** Adebayo, Olumide · 64 M · MRN 10458291\n\n**Attending:** Dr. R. Patel, MD — Cardiology\n\n### Diagnosis\n\n- NSTEMI \`I21.4\` — confirmed by troponin rise\n- Essential hypertension \`I10\`\n- Hyperlipidemia \`E78.5\`\n\n### Hospital Course\n\nPatient presented with _substernal chest pressure_ radiating to the left arm × 2 hours. Initial troponin 0.04 ng/mL; repeat at 14:42 returned critical at **2.10 ng/mL**.\n\nCardiac catheterisation on May 1 revealed 85% LAD stenosis. Drug-eluting stent placed without complication.\n\n> Patient tolerated the procedure well. Ejection fraction post-procedure 52%, improved from 45% on admission.\n\n### Discharge Medications\n\n1. Aspirin 81 mg PO daily\n2. Clopidogrel 75 mg PO daily × 12 months\n3. Atorvastatin 80 mg PO QHS\n4. Metoprolol succinate 50 mg PO daily\n5. Lisinopril 10 mg PO daily\n\n---\n\n*Follow-up with cardiology in 1 week. Call 911 for any recurrence of chest pain.*`}
          </MarkdownViewer>
        </div>
      </Section>
    </div>
  );
}
