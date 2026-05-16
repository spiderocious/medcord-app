import { ChevronRight, MoreHorizontal, ArrowLeft, ArrowRight, Search, Pencil, Download, Plus, ClipboardCheck } from '@icons';
import { Button, IrreversibleButton, SplitButton } from '@medcord/ui';
import { Section, ComponentRow } from '@features/shell/parts/preview-canvas';

function ModalFooterScene() {
  return (
    <div className="flex items-center gap-2 p-[14px_18px] bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md">
      <Button variant="quiet">Save draft</Button>
      <div className="flex-1" />
      <Button variant="secondary">Discard</Button>
      <Button variant="primary" rightIcon={<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}>
        Sign &amp; submit
      </Button>
    </div>
  );
}

function InlineRowScene() {
  return (
    <div className="grid gap-3 p-[14px_18px] bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md"
      style={{ gridTemplateColumns: 'auto 1fr auto auto auto', alignItems: 'center' }}>
      <div className="w-8 h-8 rounded-full bg-[var(--patient-100)] text-[var(--patient-700)] flex items-center justify-center text-[11px] font-semibold font-mono flex-shrink-0">
        OA
      </div>
      <div>
        <div className="text-[14px] font-medium text-[var(--text-primary)]">Adebayo, Olumide</div>
        <div className="text-[11px] font-mono text-[var(--text-tertiary)]">MRN 10458291 · 64 M · 312A</div>
      </div>
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--status-in-room-bg)] text-[var(--status-in-room-fg)] border border-[var(--status-in-room-border)] text-[11px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        In room
      </span>
      <Button variant="quiet" size="sm" rightIcon={<ChevronRight size={13} />}>Open chart</Button>
      <Button variant="quiet" size="sm" iconOnly aria-label="More">
        <MoreHorizontal size={14} />
      </Button>
    </div>
  );
}

function ToolbarScene() {
  return (
    <div className="inline-flex items-center gap-1 p-1.5 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg">
      <Button variant="quiet" size="sm" iconOnly aria-label="Previous"><ArrowLeft size={13} /></Button>
      <Button variant="quiet" size="sm" iconOnly aria-label="Next"><ArrowRight size={13} /></Button>
      <div className="w-px h-[18px] bg-[var(--border-default)] mx-1.5" />
      <Button variant="quiet" size="sm" iconOnly aria-label="Search"><Search size={13} /></Button>
      <Button variant="quiet" size="sm" iconOnly aria-label="Annotate"><Pencil size={13} /></Button>
      <Button variant="quiet" size="sm" iconOnly aria-label="Download"
        className="!bg-[var(--text-primary)] !text-[var(--neutral-0)] !rounded">
        <Download size={13} />
      </Button>
      <div className="w-px h-[18px] bg-[var(--border-default)] mx-1.5" />
      <Button variant="quiet" size="sm" rightIcon={<Plus size={12} />}>New note</Button>
      <Button variant="quiet" size="sm" rightIcon={<ClipboardCheck size={12} />}>Order</Button>
    </div>
  );
}

export function ButtonsScreen() {
  return (
    <div>
      <Section
        title="Sign & submit"
        description="Primary action at the end of a chart task. Lives at the bottom-right of the sheet."
      >
        <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-[0.08em] mb-2">The footer</div>
        <ModalFooterScene />
        <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
          Quiet on the left for "save draft", secondary for "back", primary for the action that ends the task. Never two primaries.
        </p>
      </Section>

      <Section title="In a row" description="Quiet buttons sit alongside content without competing with the row's primary content.">
        <InlineRowScene />
      </Section>

      <Section title="In a toolbar" description="Icon-only buttons on a single sheet. Tooltips carry the names; icons carry the meaning.">
        <ToolbarScene />
      </Section>

      <Section title="Split — primary with related" description="Clicking the left label performs the selected action. The chevron opens a dropdown to change the selection. Side controls where the menu appears.">
        <ComponentRow label="Bottom (default)">
          <SplitButton
            options={[
              { label: 'Sign & submit', value: 'sign' },
              { label: 'Save draft', value: 'draft' },
              { label: 'Send for co-sign', value: 'cosign' },
            ]}
            defaultValue="sign"
            side="bottom"
            onSelect={() => { /* demo: log selected option */ }}
          />
          <SplitButton
            options={[
              { label: 'Sign & submit', value: 'sign' },
              { label: 'Save draft', value: 'draft' },
            ]}
            size="sm"
            side="bottom"
          />
          <SplitButton
            options={[
              { label: 'Sign & submit', value: 'sign' },
              { label: 'Save draft', value: 'draft' },
              { label: 'Send for co-sign', value: 'cosign' },
              { label: 'Discard changes', value: 'discard', disabled: true },
            ]}
            size="lg"
            side="bottom"
          />
        </ComponentRow>
        <ComponentRow label="Top">
          <SplitButton
            options={[
              { label: 'Admit patient', value: 'admit' },
              { label: 'Hold pending labs', value: 'hold' },
              { label: 'Refer to specialist', value: 'refer' },
            ]}
            defaultValue="admit"
            side="top"
          />
        </ComponentRow>
      </Section>

      <Section title="Irreversible" description="Hold to confirm. For actions that cannot be undone — discharge AMA, override an allergy, void a signed order.">
        <ComponentRow>
          <IrreversibleButton>Hold to discharge against advice</IrreversibleButton>
        </ComponentRow>
        <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
          Black ink with a hairline of arterial red beneath the label. On press, the red rises through the button over 1.5s.
          Release before full and the action is cancelled.
        </p>
      </Section>

      <Section title="Variants">
        <ComponentRow label="Primary">
          <Button variant="primary" size="sm">Sign</Button>
          <Button variant="primary" size="md">Sign</Button>
          <Button variant="primary" size="lg">Sign</Button>
        </ComponentRow>
        <ComponentRow label="Secondary">
          <Button variant="secondary" size="sm">Cancel</Button>
          <Button variant="secondary" size="md">Cancel</Button>
          <Button variant="secondary" size="lg">Cancel</Button>
        </ComponentRow>
        <ComponentRow label="Quiet">
          <Button variant="quiet" size="sm">Save draft</Button>
          <Button variant="quiet" size="md">Save draft</Button>
          <Button variant="quiet" size="lg">Save draft</Button>
        </ComponentRow>
      </Section>

      <Section title="States">
        <ComponentRow label="Loading">
          <Button variant="primary" loading>Signing</Button>
          <Button variant="secondary" loading>Loading</Button>
          <Button variant="quiet" loading>Saving</Button>
        </ComponentRow>
        <ComponentRow label="Confirmed / Just-saved">
          <Button variant="quiet" size="sm" confirmed>Saved</Button>
          <Button variant="primary" confirmed>Submitted</Button>
        </ComponentRow>
        <ComponentRow label="Disabled">
          <Button variant="primary" disabled>Sign</Button>
          <Button variant="secondary" disabled>Cancel</Button>
          <Button variant="quiet" disabled>Save draft</Button>
        </ComponentRow>
      </Section>

      <Section title="With icons">
        <ComponentRow>
          <Button variant="primary" rightIcon={<ChevronRight size={14} />}>Continue</Button>
          <Button variant="secondary" leftIcon={<ArrowLeft size={14} />}>Back</Button>
          <Button variant="quiet" rightIcon={<Plus size={14} />}>Add patient</Button>
          <Button variant="quiet" iconOnly aria-label="More options"><MoreHorizontal size={14} /></Button>
          <Button variant="secondary" iconOnly size="sm" aria-label="Search"><Search size={13} /></Button>
        </ComponentRow>
      </Section>
    </div>
  );
}
