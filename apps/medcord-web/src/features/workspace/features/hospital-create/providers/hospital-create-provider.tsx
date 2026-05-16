import { createContext, useContext, useState, type ReactNode } from 'react';

import type { HospitalType } from '@shared/types/hospital.ts';

export interface HospitalCreateDraft {
  readonly name: string;
  readonly type: HospitalType;
  readonly location: string;
  readonly subdomain: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly timezone: string;
}

const DEFAULT_DRAFT: HospitalCreateDraft = {
  name: '',
  type: 'general',
  location: '',
  subdomain: '',
  phone: '',
  email: '',
  address: '',
  timezone: 'UTC',
};

interface HospitalCreateContextValue {
  readonly step: 1 | 2;
  readonly draft: HospitalCreateDraft;
  readonly setDraft: (patch: Partial<HospitalCreateDraft>) => void;
  readonly goToReview: () => void;
  readonly goBack: () => void;
}

const HospitalCreateContext = createContext<HospitalCreateContextValue | null>(null);

interface HospitalCreateProviderProps {
  readonly children: ReactNode;
}

export function HospitalCreateProvider({ children }: HospitalCreateProviderProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraftState] = useState<HospitalCreateDraft>(DEFAULT_DRAFT);

  function setDraft(patch: Partial<HospitalCreateDraft>) {
    setDraftState((prev) => ({ ...prev, ...patch }));
  }

  function goToReview() { setStep(2); }
  function goBack() { setStep(1); }

  return (
    <HospitalCreateContext.Provider value={{ step, draft, setDraft, goToReview, goBack }}>
      {children}
    </HospitalCreateContext.Provider>
  );
}

export function useHospitalCreate(): HospitalCreateContextValue {
  const ctx = useContext(HospitalCreateContext);
  if (ctx === null) throw new Error('useHospitalCreate must be used inside HospitalCreateProvider');
  return ctx;
}
