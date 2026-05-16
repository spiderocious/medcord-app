import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import {
  RegistrationStepper,
  FormField,
  ConsentRow,
  InsuranceCard,
  EligibilityBox,
  RegistrationSheet,
  RegistrationFooter,
} from '@medcord/ui';

export function RegistrationScreen() {
  const [_currentStep, setCurrentStep] = useState(3);
  const [consents, setConsents] = useState({
    general: true,
    hipaa: true,
    photo: true,
    financial: false,
    research: false,
  });

  function toggleConsent(key: keyof typeof consents) {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const allRequiredSigned = consents.financial;

  return (
    <div>
      <Section
        title="Register a new patient."
        description="Multi-step intake form. Current step: 4 — Consents. Wed, May 1 · front desk · workstation REG-02."
      >
        {/* Stepper */}
        <RegistrationStepper
          steps={[
            { ordinal: '01', name: 'Identity', meta: 'Adebayo, O. · 64 M · 14 Mar 1962', status: 'done' },
            { ordinal: '02', name: 'Contact', meta: '+1 (312) 555-0148 · m.adebayo@…', status: 'done' },
            { ordinal: '03', name: 'Insurance', meta: 'BCBS · verified · copay $30', status: 'done' },
            { ordinal: '04', name: 'Consents', meta: '3 signed · 1 required', status: 'cur' },
            { ordinal: '05', name: 'Triage', meta: '— pending', status: 'todo' },
          ]}
        />

        {/* Sheet */}
        <RegistrationSheet
          title="Step four — consents."
          subtitle="All required consents must be signed before the patient may be roomed. Optional consents can be added during the visit."
        >
          {/* Patient summary form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px 32px' }}>
            <FormField label="Family name" value="Adebayo" />
            <FormField label="Given name" value="Olumide" />
            <FormField
              label="Date of birth"
              value="1962-03-14"
              mono
              computedNote={<>= <strong className="text-[var(--text-primary)] font-mono not-italic">64</strong> years</>}
            />
            <FormField
              label="Sex assigned at birth"
              type="select"
              options={['Male', 'Female', 'Intersex', 'Prefer not to say']}
              value="Male"
            />
            <FormField
              label="Mobile"
              value="+1 (312) 555-0148"
              mono
              helpText="verified · primary contact"
            />
            <FormField label="Email" value="m.adebayo@example.com" />
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="Address" value="142 W Lakeside Dr · Chicago, IL 60615" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="Emergency contact" value="Funmi Adebayo · spouse · +1 (312) 555-0193" />
            </div>
          </div>

          {/* Insurance + Eligibility */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 18 }}>
            <InsuranceCard
              title="Insurance — BlueCross BlueShield"
              meta="verified · 12 min ago"
              frontFace={{
                variant: 'dark',
                topLabel: 'Front · Member',
                name: 'ADEBAYO O',
                id: 'XYL923847562',
                bottomLine: 'Group · 1184-CORP',
              }}
              backFace={{
                variant: 'light',
                topLabel: 'Back',
                name: '',
                id: '',
                body: (
                  <div className="font-serif italic text-[13px] text-[var(--text-secondary)] leading-[1.4]">
                    Customer service<br />1-800-555-0148
                  </div>
                ),
                bottomLine: 'RxBIN 003858 · PCN A4',
              }}
            />
            <EligibilityBox
              status="Active · in-network"
              detail="copay $30 · deductible $1,250 met"
              estimateLabel="Estimate · today"
              estimateValue="$30 + lab fees"
              estimateNote="final billed amount may differ"
            />
          </div>

          {/* Consent rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
            <ConsentRow
              name="General consent for treatment"
              meta="signed 14:08 · witness A. Williams RN · valid 12 mo"
              variant="signed"
              checked={consents.general}
              actionLabel="View"
              onToggle={() => toggleConsent('general')}
            />
            <ConsentRow
              name="HIPAA notice of privacy practices"
              meta="acknowledged 14:09 · electronic signature"
              variant="signed"
              checked={consents.hipaa}
              actionLabel="View"
              onToggle={() => toggleConsent('hipaa')}
            />
            <ConsentRow
              name="Photography & telehealth recording"
              meta="consented 14:10 · revocable any time"
              variant="signed"
              checked={consents.photo}
              actionLabel="View"
              onToggle={() => toggleConsent('photo')}
            />
            <ConsentRow
              name="Financial responsibility — required"
              meta="patient + witness signature · before roomed"
              variant="required"
              checked={consents.financial}
              actionLabel="Capture signature"
              onToggle={() => toggleConsent('financial')}
            />
            <ConsentRow
              name="Optional · research participation"
              meta="may be added during the visit"
              variant="optional"
              checked={consents.research}
              actionLabel="Skip"
              onToggle={() => toggleConsent('research')}
            />
          </div>
        </RegistrationSheet>

        {/* Footer */}
        <RegistrationFooter
          whyText='"One signature remains. The patient may be roomed once financial responsibility is signed by both parties."'
          backLabel="‹ Back · Insurance"
          continueLabel="Continue · Triage →"
          continueDisabled={!allRequiredSigned}
          onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
          onContinue={() => setCurrentStep((s) => Math.min(4, s + 1))}
        />
      </Section>
    </div>
  );
}
