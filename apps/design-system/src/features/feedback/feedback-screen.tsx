import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import {
  Toast, UndoStrip, OptimisticIndicator,
  ToastManager, useToast,
  PageBanner, Alert, ContextMenu,
} from '@medcord/ui';
import { Button } from '@medcord/ui';

export function FeedbackScreen() {
  const { toasts, toast, dismiss } = useToast();
  const [ctxOpen, setCtxOpen] = useState(false);

  function addToast(variant: 'info' | 'ok' | 'warn' | 'crit') {
    const configs = {
      info: { title: 'Patient roomed', description: 'Adebayo, O. moved to 312A.' },
      ok: { title: 'Order signed', description: 'Lisinopril 10 mg PO daily — sent to pharmacy.' },
      warn: {
        title: 'Auto-logout in 60 seconds',
        description: 'Your session will lock for HIPAA. Move the mouse to extend.',
        actions: [
          { label: 'Stay signed in', onClick: () => {} },
          { label: 'Lock now', onClick: () => {} },
        ],
      },
      crit: {
        title: 'Lab order failed',
        description: 'EMR connection timed out at 14:42.',
        actions: [
          { label: 'Retry', variant: 'danger' as const, onClick: () => {} },
          { label: 'Open offline', onClick: () => {} },
        ],
      },
    };
    toast({ variant, ...configs[variant] });
  }

  return (
    <div>
      {/* Toasts — static specimens */}
      <Section
        title="Toasts — slips on the desk."
        description="Sheet, hairline edge, 3-pixel ink rule on the leading edge that takes the colour of the state. The desc is serif italic, like a marginal note."
      >
        <div className="bg-[var(--surface-sunken)] border border-[var(--border-default)] p-7 flex flex-col gap-3 items-end">
          <Toast
            variant="info"
            title="Patient roomed"
            description="Adebayo, O. moved to 312A."
            onDismiss={() => {}}
          />
          <Toast
            variant="ok"
            title="Order signed"
            description="Lisinopril 10 mg PO daily — sent to pharmacy."
            onDismiss={() => {}}
          />
          <Toast
            variant="warn"
            title="Auto-logout in 60 seconds"
            description="Your session will lock for HIPAA. Move the mouse to extend."
            actions={[
              { label: 'Stay signed in', onClick: () => {} },
              { label: 'Lock now', onClick: () => {} },
            ]}
            onDismiss={() => {}}
          />
          <Toast
            variant="crit"
            title="Lab order failed"
            description="EMR connection timed out at 14:42."
            actions={[
              { label: 'Retry', variant: 'danger', onClick: () => {} },
              { label: 'Open offline', onClick: () => {} },
            ]}
            onDismiss={() => {}}
          />
          <Toast
            variant="info"
            title="Uploading echocardiogram"
            description="echo_2026-04-30.dcm · 14.2 MB"
            progress={62}
          />
          <UndoStrip
            message="Encounter wrap-up complete."
            onUndo={() => {}}
          />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Live fire →</span>
          <Button variant="quiet" size="sm" onClick={() => addToast('info')}>Info</Button>
          <Button variant="quiet" size="sm" onClick={() => addToast('ok')}>Ok</Button>
          <Button variant="quiet" size="sm" onClick={() => addToast('warn')}>Warn</Button>
          <Button variant="quiet" size="sm" onClick={() => addToast('crit')}>Crit</Button>
        </div>
        <ToastManager toasts={toasts} onDismiss={dismiss} />
      </Section>

      {/* Page banners */}
      <Section
        title="Banners — typeset rules across the page."
        description="A mono stamp on the left, the message in serif/sans, actions on the right. Persistent; rare."
      >
        <div className="border border-[var(--border-default)] flex flex-col">
          <PageBanner
            variant="info"
            stamp="Read-only"
            message={<>This chart is signed and cannot be edited. <em className="font-serif italic text-[var(--text-tertiary)]">Open an addendum to add new findings.</em></>}
            action={{ label: 'Open addendum', onClick: () => {} }}
          />
          <PageBanner
            variant="warn"
            stamp="Maintenance"
            message={<><strong className="font-semibold">EMR maintenance window</strong> · 2026-05-04 02:00 – 04:00 CDT. Use offline downtime forms during this window.</>}
            action={{ label: 'View checklist', onClick: () => {} }}
          />
          <PageBanner
            variant="ok"
            stamp="Bundle"
            message={<><strong className="font-semibold">Sepsis bundle complete.</strong> All five elements documented within the 1-hour window.</>}
          />
          <PageBanner
            variant="crit"
            stamp="Critical"
            message={<><strong className="font-semibold">Troponin 2.10 ng/mL</strong> for Hadi, S. acknowledged by R. Patel MD at 14:42. Consider STEMI workup.</>}
            action={{ label: 'Open chart', onClick: () => {} }}
          />
          <PageBanner
            variant="system"
            stamp="Workstation"
            message={<><strong className="font-semibold">NUR-3N-04</strong> · 3-North charge desk · shared device. <em className="font-serif italic opacity-65">Charts auto-lock after five minutes idle.</em></>}
          />
        </div>
      </Section>

      {/* Alerts / callouts */}
      <Section
        title="Alerts &amp; callouts — quotes from the page."
        description="For tips, drug-interactions, and inline guidance. The body is serif italic — they read like a note in the margin."
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Alert
            variant="default"
            label="Tip"
            title="Pin frequent worklists."
            description="Pin a worklist with ⌘ P; it will appear in your sidebar across sessions, on any workstation."
          />
          <Alert
            variant="warn"
            label="Drug interaction"
            title="Bleeding risk increased."
            description="Warfarin + Aspirin · INR check recommended within 72 hours."
          />
          <Alert
            variant="crit"
            label="Critical"
            title="Acknowledgement required."
            description="Troponin 2.10 ng/mL crossed the critical line at 14:42. The auto-page has been sent."
          />
          <Alert
            variant="ok"
            label="Confirmed"
            title="Note signed."
            description="Progress note for Adebayo, O. signed and locked. Visible to the care team."
          />
        </div>
      </Section>

      {/* Optimistic + context menu */}
      <Section
        title="Optimistic indicator &amp; context menu."
        description="Saving in the background; right-click sheets the rest."
      >
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-3">Optimistic update</div>
            <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] px-5 py-4 flex flex-col gap-3.5">
              <div className="flex items-center gap-3.5">
                <div className="font-serif text-[18px] font-medium text-[var(--text-primary)]">Vital signs · 14:42</div>
                <OptimisticIndicator />
              </div>
              <div className="font-mono text-[13px] text-[var(--text-primary)] tracking-[0]">HR 76 · BP 128/82 · SpO₂ 98% · Temp 98.6 °F</div>
              <p className="m-0 font-serif italic text-[13px] text-[var(--text-tertiary)] leading-[1.5]">
                &quot;The values are visible to your team immediately. They will be reconciled with the server when the connection is restored.&quot;
              </p>
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-3">Context menu</div>
            <div className="relative">
              <Button variant="quiet" size="sm" onClick={() => setCtxOpen(true)}>
                Right-click me ···
              </Button>
              <div className="mt-2">
                <ContextMenu
                  open={ctxOpen}
                  onClose={() => setCtxOpen(false)}
                  items={[
                    { id: 'lbl-patient', groupLabel: 'Patient' },
                    { id: 'open', glyph: '→', label: 'Open chart', shortcut: '↵' },
                    { id: 'note', glyph: '+', label: 'Add note', shortcut: 'N' },
                    { id: 'more', glyph: '›', label: 'More…', shortcut: '›' },
                    { id: 'div1', divider: true },
                    { id: 'lbl-workflow', groupLabel: 'Workflow' },
                    { id: 'transfer', glyph: '⇄', label: 'Transfer bed' },
                    { id: 'seen', glyph: '✓', label: 'Mark seen' },
                    { id: 'div2', divider: true },
                    { id: 'discharge', glyph: '×', label: 'Discharge AMA', shortcut: '⌫', variant: 'danger' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
