import type { Patient } from '@features/patients/shared/types/patient.ts';
import type { Asset } from '@features/assets/shared/types/asset.ts';
import type { LabOrder } from '@features/labs/shared/types/lab.ts';

export interface SearchResults {
  readonly patients?: readonly Patient[];
  readonly assets?: readonly Asset[];
  readonly labs?: readonly LabOrder[];
}
