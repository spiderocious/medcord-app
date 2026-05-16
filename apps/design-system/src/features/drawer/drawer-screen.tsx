import { DrawerService } from '@medcord/ui';
import { Section, ComponentRow } from '@features/shell/parts/preview-canvas';
import { Button } from '@medcord/ui';

export function DrawerScreen() {
  return (
    <div>
      {/* Toasts */}
      <Section
        title="Toasts"
        description="Imperative. Call DrawerService.toast() from anywhere. Auto-dismissed after 4s unless sticky. Position: top or bottom."
      >
        <ComponentRow label="Types">
          <Button variant="quiet" size="sm" onClick={() => DrawerService.toast('Chart saved successfully.', { type: 'success' })}>
            Success
          </Button>
          <Button variant="quiet" size="sm" onClick={() => DrawerService.toast('Lab result: critical potassium 2.8 mEq/L.', { type: 'error' })}>
            Error
          </Button>
          <Button variant="quiet" size="sm" onClick={() => DrawerService.toast('Allergy conflict detected — review before ordering.', { type: 'warning' })}>
            Warning
          </Button>
          <Button variant="quiet" size="sm" onClick={() => DrawerService.toast('Adebayo, O. moved to room 312A.', { type: 'info' })}>
            Info
          </Button>
        </ComponentRow>
        <ComponentRow label="Position">
          <Button variant="quiet" size="sm" onClick={() => DrawerService.toast('Top toast — system alert.', { type: 'warning', position: 'top' })}>
            Top
          </Button>
          <Button variant="quiet" size="sm" onClick={() => DrawerService.toast('Bottom toast — confirmation.', { type: 'success', position: 'bottom' })}>
            Bottom
          </Button>
        </ComponentRow>
        <ComponentRow label="Sticky">
          <Button variant="quiet" size="sm" onClick={() => DrawerService.toast('Sticky toast — manual dismiss required.', { type: 'error', sticky: true })}>
            Sticky (no auto-dismiss)
          </Button>
        </ComponentRow>
        <ComponentRow label="Dismiss">
          <Button variant="quiet" size="sm" onClick={() => DrawerService.dismissAllToasts()}>
            Dismiss all toasts
          </Button>
        </ComponentRow>
      </Section>

      {/* Feedback Modals */}
      <Section
        title="Feedback modal"
        description="One-button acknowledgement. Use for non-actionable results: success, error, informational. Position: center, top, bottom, fullscreen."
      >
        <ComponentRow label="Kinds">
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showFeedbackModal(
              'Chart submitted',
              'The progress note for Adebayo, Olumide has been signed and submitted to the EHR.',
              { kind: 'success', confirmButtonText: 'Done' },
            )
          }>
            Success
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showFeedbackModal(
              'Order failed',
              'Unable to submit order for metoprolol 50 mg — pharmacy system is offline. Retry in a few minutes.',
              { kind: 'error', confirmButtonText: 'Understood' },
            )
          }>
            Error
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showFeedbackModal(
              'Drug interaction detected',
              'Warfarin + Amoxicillin has a moderate interaction. Increased INR monitoring recommended.',
              { kind: 'warning', confirmButtonText: 'Acknowledged' },
            )
          }>
            Warning
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showFeedbackModal(
              'Bed transfer requested',
              'Room 312A has been requested for Adebayo, Olumide. Housekeeping notified.',
              { kind: 'info' },
            )
          }>
            Info
          </Button>
        </ComponentRow>
        <ComponentRow label="Positions">
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showFeedbackModal('Top sheet', 'This modal slides from the top.', { position: 'top' })
          }>
            Top
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showFeedbackModal('Bottom sheet', 'This modal appears as a bottom sheet.', { position: 'bottom' })
          }>
            Bottom
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showFeedbackModal('Fullscreen', 'This modal takes over the entire viewport.', { position: 'fullscreen' })
          }>
            Fullscreen
          </Button>
        </ComponentRow>
      </Section>

      {/* Confirmation Modals */}
      <Section
        title="Confirmation modal"
        description="Two-button decision gate. Destructive variant uses danger red for the confirm button."
      >
        <ComponentRow label="Standard">
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showConfirmationModal(
              'Discharge patient?',
              'Adebayo, Olumide will be discharged from unit 3B. A discharge summary will be generated automatically.',
              {
                confirmButtonText: 'Discharge',
                cancelButtonText: 'Not yet',
                onConfirm: () => DrawerService.toast('Patient discharged.', { type: 'success' }),
              },
            )
          }>
            Confirm discharge
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showConfirmationModal(
              'Send for co-sign?',
              'This note will be sent to Dr. Patel for co-signature. You will be notified once signed.',
              {
                confirmButtonText: 'Send',
                onConfirm: () => DrawerService.toast('Note sent for co-sign.', { type: 'info' }),
              },
            )
          }>
            Co-sign request
          </Button>
        </ComponentRow>
        <ComponentRow label="Destructive">
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showConfirmationModal(
              'Void signed order?',
              'Voiding a signed order is irreversible and will be flagged in the audit log. This action requires a supervisor review.',
              {
                kind: 'error',
                destructive: true,
                confirmButtonText: 'Void order',
                cancelButtonText: 'Keep order',
                onConfirm: () => DrawerService.toast('Order voided. Audit entry created.', { type: 'warning' }),
              },
            )
          }>
            Void order (destructive)
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showConfirmationModal(
              'Override allergy flag?',
              'Proceeding overrides the flagged penicillin allergy for this order. This will be logged.',
              {
                destructive: true,
                confirmButtonText: 'Override',
                onConfirm: () => DrawerService.toast('Allergy override logged.', { type: 'error' }),
              },
            )
          }>
            Override allergy
          </Button>
        </ComponentRow>
      </Section>

      {/* Input Modals */}
      <Section
        title="Input modal"
        description="Collects text from the clinician inline. Supports single-line, multiline, email, password, and step labels."
      >
        <ComponentRow label="Variants">
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showInputModal(
              'Add clinical note',
              'Enter a brief note to attach to this order.',
              {
                placeholder: 'e.g. Hold if systolic < 90 mmHg',
                confirmButtonText: 'Add note',
                onConfirm: (val) => DrawerService.toast(`Note added: "${val}"`, { type: 'success' }),
              },
            )
          }>
            Single line
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showInputModal(
              'Discharge instructions',
              'Provide patient-facing discharge instructions.',
              {
                placeholder: 'Follow up with cardiology in 1 week…',
                confirmButtonText: 'Save instructions',
                multiline: true,
                onConfirm: (val) => DrawerService.toast(`Saved ${val.length} characters.`, { type: 'success' }),
              },
            )
          }>
            Multiline
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showInputModal(
              'Enter password',
              'Re-authenticate to co-sign this note.',
              {
                inputType: 'password',
                confirmButtonText: 'Authenticate',
                stepLabel: '2/2',
                onConfirm: () => DrawerService.toast('Authentication successful.', { type: 'success' }),
              },
            )
          }>
            Password + step label
          </Button>
        </ComponentRow>
      </Section>

      {/* Custom Modals */}
      <Section
        title="Custom modal"
        description="Pass a render function to showCustomModal. Full control of content inside the modal shell."
      >
        <ComponentRow label="Custom content">
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showCustomModal(
              'Adebayo, Olumide — vitals',
              () => (
                <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  {[
                    { label: 'BP', value: '138/88', unit: 'mmHg' },
                    { label: 'HR', value: '92', unit: 'bpm' },
                    { label: 'SpO₂', value: '96', unit: '%' },
                    { label: 'Temp', value: '37.2', unit: '°C' },
                    { label: 'RR', value: '18', unit: '/min' },
                    { label: 'Pain', value: '7', unit: '/10' },
                  ].map((v) => (
                    <div key={v.label} className="border border-[var(--border-default)] p-3">
                      <div className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">{v.label}</div>
                      <div className="font-serif text-[22px] font-medium text-[var(--text-primary)] leading-none mt-1">{v.value}</div>
                      <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-1">{v.unit}</div>
                    </div>
                  ))}
                </div>
              ),
            )
          }>
            Vitals card
          </Button>
          <Button variant="quiet" size="sm" onClick={() =>
            DrawerService.showCustomModal(
              'Lab results',
              () => (
                <div className="flex flex-col">
                  {[
                    { name: 'WBC', value: '11.2', ref: '4.5–11.0', flag: 'H' },
                    { name: 'HGB', value: '10.8', ref: '12.0–16.0', flag: 'L' },
                    { name: 'PLT', value: '224', ref: '150–400', flag: '' },
                    { name: 'BUN', value: '22', ref: '7–20', flag: 'H' },
                    { name: 'Creat', value: '1.1', ref: '0.6–1.2', flag: '' },
                  ].map((row, i) => (
                    <div key={i} className="grid items-center border-b border-dashed border-[var(--border-default)] py-2 last:border-b-0 gap-3" style={{ gridTemplateColumns: '60px 1fr auto 24px' }}>
                      <span className="font-mono text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.1em]">{row.name}</span>
                      <span className="font-serif text-[16px] font-medium text-[var(--text-primary)]">{row.value}</span>
                      <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{row.ref}</span>
                      <span className={`font-mono text-[10px] font-bold ${row.flag === 'H' ? 'text-[var(--danger-icon)]' : row.flag === 'L' ? 'text-[var(--warning-icon)]' : ''}`}>{row.flag}</span>
                    </div>
                  ))}
                </div>
              ),
              { position: 'center' },
            )
          }>
            Lab table
          </Button>
        </ComponentRow>
      </Section>

      {/* Global dismiss */}
      <Section title="Global controls" description="Dismiss all active overlays at once.">
        <ComponentRow>
          <Button variant="secondary" size="sm" onClick={() => DrawerService.dismissAllModals()}>Dismiss all modals</Button>
          <Button variant="secondary" size="sm" onClick={() => DrawerService.dismissAllToasts()}>Dismiss all toasts</Button>
          <Button variant="secondary" size="sm" onClick={() => DrawerService.dismissAll()}>Dismiss everything</Button>
        </ComponentRow>
      </Section>
    </div>
  );
}
