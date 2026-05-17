import { v4 as uuidv4 } from 'uuid';

const make = (prefix: string): string => `${prefix}${uuidv4()}`;

export const newId = {
  user: () => make('USR-'),
  hospital: () => make('HSP-'),
  member: () => make('MBR-'),
  invitation: () => make('INV-'),
  role: () => make('ROL-'),
  patient: () => make('PAT-'),
  patientCode: () => make('CAE-'),
  transfer: () => make('TRF-'),
  vitals: () => make('VIT-'),
  medication: () => make('MED-'),
  procedure: () => make('PRO-'),
  immunization: () => make('IMM-'),
  chartDoc: () => make('CDO-'),
  labOrder: () => make('LAB-'),
  asset: () => make('AST-'),
  reviewItem: () => make('REV-'),
  auditLog: () => make('AUD-'),
  notification: () => make('NOT-'),
  visit: () => make('VIS-'),
  unit: () => make('UNT-'),
  admission: () => make('ADM-'),
};

export const newRawId = (): string => uuidv4();
