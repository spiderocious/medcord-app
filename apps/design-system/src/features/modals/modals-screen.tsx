import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import {
  Modal, ModalGap, ModalField, CritCallout, AuditNote,
  TypedConfirmModal, TwoPersonModal, SessionTimeoutModal, BreakTheGlassModal,
} from '@ui/modal';
import { Button } from '@ui/button';

export function ModalsScreen() {
  /* individual open states */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [critOpen, setCritOpen] = useState(false);
  const [typedOpen, setTypedOpen] = useState(false);
  const [twoPersonOpen, setTwoPersonOpen] = useState(false);
  const [timeoutOpen, setTimeoutOpen] = useState(false);
  const [btgOpen, setBtgOpen] = useState(false);

  return (
    <div>
      {/* A. Confirm */}
      <Section
        title="Confirm — a small sheet."
        description="Asks once, clearly. Cancel on the left; destructive action on the right in critical red."
      >
        <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(true)}>
          Discontinue medication…
        </Button>
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          size="sm"
          title="Discontinue Lisinopril?"
          footer={
            <>
              <ModalGap />
              <Button variant="quiet" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <button
                type="button"
                className="h-8 px-3.5 rounded-[4px] font-ui text-[13px] font-medium text-[var(--danger-icon)] border border-[var(--danger-icon)] cursor-pointer bg-transparent hover:bg-[var(--danger-icon)] hover:text-[var(--neutral-0)] transition-colors"
                onClick={() => setConfirmOpen(false)}
              >
                Discontinue
              </button>
            </>
          }
        >
          This medication will be marked discontinued effective now. The MAR row will close. You can reorder from the chart if needed.
        </Modal>
      </Section>

      {/* B. Critical — drug allergy override */}
      <Section
        title="Critical — drug allergy override."
        description="Red header band, critical callout, mandatory reason select, clinical justification textarea, and an audit note. The confirm button carries an irrev underline."
      >
        <Button variant="primary" size="sm" onClick={() => setCritOpen(true)}>
          Order Amoxicillin…
        </Button>
        <Modal
          open={critOpen}
          onClose={() => setCritOpen(false)}
          size="md"
          variant="critical"
          title="Allergy override · explicit acknowledgement required"
          meta="CRITICAL"
          footer={
            <>
              <ModalGap />
              <Button variant="secondary" size="sm" onClick={() => setCritOpen(false)}>Cancel · do not order</Button>
              <button
                type="button"
                className="h-8 px-4 rounded-[4px] font-ui text-[13px] font-medium bg-[var(--text-primary)] text-[var(--neutral-0)] border-0 cursor-pointer relative overflow-hidden hover:opacity-90"
                onClick={() => setCritOpen(false)}
              >
                Override and order
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[var(--danger-icon)]" />
              </button>
            </>
          }
        >
          <CritCallout
            title="Penicillin · anaphylaxis"
            description={<>You are ordering <strong>Amoxicillin 500 mg PO TID</strong> — same drug class. This is a potentially life-threatening interaction.</>}
          />
          <ModalField label="Reason for override · required">
            <select className="font-ui text-[14px] text-[var(--text-primary)] bg-transparent border-0 border-b border-[var(--border-default)] pb-1.5 outline-none w-full focus:border-[var(--text-primary)] cursor-pointer">
              <option>— select reason —</option>
              <option>Benefit outweighs risk · documented</option>
              <option>Reaction was non-anaphylactic / mild</option>
              <option>Patient tolerates current dose</option>
              <option>Other (specify)</option>
            </select>
          </ModalField>
          <ModalField label="Clinical justification">
            <textarea
              className="bg-[var(--surface-sunken)] border border-[var(--border-default)] px-2.5 py-2 font-serif italic text-[14px] text-[var(--text-primary)] leading-[1.5] outline-none resize-y min-h-[64px] w-full focus:border-[var(--text-primary)]"
              placeholder="Detail the clinical rationale and what alternatives were considered…"
            />
          </ModalField>
          <AuditNote>
            This action will be logged with your name, time, and workstation. The pharmacist will review.
          </AuditNote>
        </Modal>
      </Section>

      {/* C. Typed confirm */}
      <Section
        title="Typed confirm — discharge AMA."
        description={'Irreversible action requires typing "DISCHARGE" in full before the button activates.'}
      >
        <Button variant="quiet" size="sm" onClick={() => setTypedOpen(true)}>
          Discharge against medical advice…
        </Button>
        <TypedConfirmModal
          open={typedOpen}
          onClose={() => setTypedOpen(false)}
          title="Discharge against medical advice"
          description="This action is irreversible and requires attending sign-off. The patient will be marked AMA, and the consequences will be entered into the chart."
          confirmWord="DISCHARGE"
          confirmLabel="Discharge AMA"
          onConfirm={() => setTypedOpen(false)}
        />
      </Section>

      {/* D. Two-person verification */}
      <Section
        title="Two-person verification — insulin drip."
        description="High-risk medication requires two authenticated signatures before infusion begins."
      >
        <Button variant="secondary" size="sm" onClick={() => setTwoPersonOpen(true)}>
          Begin insulin drip…
        </Button>
        <TwoPersonModal
          open={twoPersonOpen}
          onClose={() => setTwoPersonOpen(false)}
          title="Two-person verification · Insulin drip"
          medicationText="Insulin regular · 100 U / 100 mL NS · start 4 U/h · titrate per protocol"
          primary={{
            initials: 'AW',
            name: 'Williams, Aiyana RN',
            role: '3-N · BSN · pager ×3214',
            authenticated: true,
            authenticatedAt: '14:42:08',
          }}
          onConfirm={() => setTwoPersonOpen(false)}
        />
      </Section>

      {/* E. Session timeout */}
      <Section
        title="Session timeout — HIPAA lock."
        description="Countdown timer in amber. Locks the workstation automatically when it reaches zero."
      >
        <Button variant="quiet" size="sm" onClick={() => setTimeoutOpen(true)}>
          Preview timeout modal…
        </Button>
        <SessionTimeoutModal
          open={timeoutOpen}
          secondsRemaining={42}
          workstation="NUR-3N-04"
          onLockNow={() => setTimeoutOpen(false)}
          onStaySignedIn={() => setTimeoutOpen(false)}
        />
      </Section>

      {/* F. Break the glass */}
      <Section
        title="Break-the-glass — emergency PHI access."
        description="The heaviest modal. Ink-on-paper framing, mandatory reason, full audit trail. Confirm button is irrev-styled."
      >
        <Button variant="quiet" size="sm" onClick={() => setBtgOpen(true)}>
          Access outside patient chart…
        </Button>
        <BreakTheGlassModal
          open={btgOpen}
          onClose={() => setBtgOpen(false)}
          patient={{
            initials: 'OA',
            name: 'Adebayo, Olumide · 64 M',
            mrn: '10458291',
            location: '3-N · 312A',
          }}
          onAcknowledge={() => setBtgOpen(false)}
        />
      </Section>
    </div>
  );
}
