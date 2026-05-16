export type LabOrderStatus =
  | 'awaiting_sample'
  | 'sample_received'
  | 'awaiting_test'
  | 'in_progress'
  | 'awaiting_result'
  | 'result_ready'
  | 'result_released';

export interface LabResult {
  readonly value: string;
  readonly unit?: string;
  readonly referenceRange?: string;
  readonly isAbnormal: boolean;
  readonly notes?: string;
}

export interface LabStateHistory {
  readonly from: LabOrderStatus;
  readonly to: LabOrderStatus;
  readonly changedBy: string;
  readonly changedAt: string;
  readonly note?: string;
}

export interface LabOrder {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly orderedBy: string;
  readonly testName: string;
  readonly testCode?: string;
  readonly category?: string;
  readonly priority: 'routine' | 'urgent' | 'stat';
  readonly status: LabOrderStatus;
  readonly stateHistory: readonly LabStateHistory[];
  readonly sampleType?: string;
  readonly sampleCollectedAt?: string;
  readonly sampleCollectedBy?: string;
  readonly result?: LabResult;
  readonly resultReleasedAt?: string;
  readonly resultReleasedBy?: string;
  readonly fileKey?: string;
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LabOrderListResult {
  readonly items: readonly LabOrder[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
